import { randomUUID } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import { DynamoDBClient, DescribeTableCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand, GetCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { convert } from "html-to-text";

const CATALOG_ORIGIN = "https://baruch-undergraduate.catalog.cuny.edu";
const API_URL = "https://app.coursedog.com/api/v1/cm/bar01/courses/search/%24filters";

const MINIMUM_COURSES = 1000;
const MAXIMUM_DROP_FRACTION = 0.2;

// A separate partition keeps coordination metadata out of the app's course query.
const IMPORT_LOCK_KEY = { school: "__course_importer__", courseCode: "Baruch College" };

const dynamo = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1", maxAttempts: 8, retryMode: "adaptive",
});
const db = DynamoDBDocumentClient.from(dynamo);
const IMPORT_STATE_KEY = { school: "__course_importer__", courseCode: "Baruch College#last-success" };

export async function handler(event = {}, context = {}) {
  const effectiveDate = effectiveDateFor(event);
  const importRequest = { effectiveDate, catalogId: event.catalogId ?? (process.env.CATALOG_ID || undefined) };
  const tableName = process.env.DYNAMODB_TABLE_NAME;
  if (!tableName) throw new Error("DYNAMODB_TABLE_NAME is required.");
  const { Table } = await dynamo.send(new DescribeTableCommand({ TableName: tableName }));
  // Terraform checks the table keys; check capacity here in case it was changed later.
  if (Table.BillingModeSummary?.BillingMode !== "PAY_PER_REQUEST") {
    throw new Error(`Table ${tableName} must use on-demand (PAY_PER_REQUEST) capacity for bulk imports. Switch its billing mode before retrying; no courses were written.`);
  }
  try {
    const summary = await withImportLock({
      db, tableName, owner: context.awsRequestId,
      remainingTimeMs: context.getRemainingTimeInMillis?.() ?? 900_000,
    }, () => syncCourses(importRequest, {
      runId: context.awsRequestId,
      async getImportState() {
        const result = await db.send(new GetCommand({
          TableName: tableName, Key: IMPORT_STATE_KEY, ConsistentRead: true,
        }));
        return result.Item;
      },
      async saveImportState(summary) {
        await db.send(new UpdateCommand({
          TableName: tableName, Key: IMPORT_STATE_KEY,
          UpdateExpression: "SET uniqueCodes = :count, effectiveDate = :date",
          ExpressionAttributeValues: { ":count": summary.uniqueCodes, ":date": summary.effectiveDate },
        }));
      },
      async listCourses() {
        const courses = [];
        let ExclusiveStartKey;
        do {
          const page = await db.send(new QueryCommand({
            TableName: tableName, KeyConditionExpression: "#school = :school",
            ExpressionAttributeNames: { "#school": "school" },
            ExpressionAttributeValues: { ":school": "Baruch College" },
            ConsistentRead: true, ExclusiveStartKey,
          }));
          courses.push(...(page.Items ?? []));
          ExclusiveStartKey = page.LastEvaluatedKey;
        } while (ExclusiveStartKey);
        return courses;
      },
      async upsertCourse(item) {
        if (context.getRemainingTimeInMillis?.() < 20_000) throw new Error("Stopping before Lambda timeout; rerun to finish remaining updates.");
        const { school, courseCode, ...fields } = item;
        const entries = Object.entries(fields);
        await db.send(new UpdateCommand({
          TableName: tableName, Key: { school, courseCode },
          UpdateExpression: `SET ${entries.map((_, i) => `#f${i} = :v${i}`).join(", ")}`,
          ExpressionAttributeNames: Object.fromEntries(entries.map(([key], i) => [`#f${i}`, key])),
          ExpressionAttributeValues: Object.fromEntries(entries.map(([, value], i) => [`:v${i}`, value])),
        }));
      },
    }));
    console.log(JSON.stringify({ event: "course_import_finished", ...summary }));
    return summary;
  } catch (error) {
    console.error(JSON.stringify({
      event: "course_import_failed", message: error.message,
      cause: error.cause?.message, causeType: error.cause?.name,
      requestId: error.cause?.$metadata?.requestId,
      throttlingReasons: error.cause?.ThrottlingReasons,
    }));
    throw error;
  }
}

// Compare the catalog with stored courses and apply changes.

async function syncCourses({ effectiveDate, catalogId }, dependencies) {
  const runId = dependencies.runId ?? randomUUID();
  const catalog = await fetchCatalog({ effectiveDate, catalogId });
  const normalized = normalizeCatalog(catalog.records);
  if (normalized.uniqueCodes < MINIMUM_COURSES) throw new Error(`Only ${normalized.uniqueCodes} course codes returned; minimum is ${MINIMUM_COURSES}. No writes performed.`);
  const existing = await dependencies.listCourses();
  const byCode = new Map(existing.map((course) => [course.courseCode, course]));
  const previousImport = await dependencies.getImportState();
  if (previousImport && (!Number.isInteger(previousImport.uniqueCodes) || previousImport.uniqueCodes < 1)) {
    throw new Error("Previous import metadata has an invalid source count; nothing will be written.");
  }
  // Retired codes stay in the table, so compare source counts, not inventory.
  // Before the first checkpoint exists, the absolute minimum still guards writes.
  if (previousImport && normalized.uniqueCodes < previousImport.uniqueCodes * (1 - MAXIMUM_DROP_FRACTION)) {
    throw new Error("Catalog count dropped by more than 20%. No writes performed; investigate the source before lowering the guard.");
  }
  if (previousImport?.effectiveDate > effectiveDate || existing.some((course) => course.sourceEffectiveDate > effectiveDate)) {
    throw new Error("This effectiveDate is older than a previous import. Use a separate table for historical imports.");
  }
  const pending = [];
  let unchanged = 0;
  for (const course of normalized.courses) {
    const item = { ...course, sourceCatalogId: catalog.catalogId, sourceEffectiveDate: effectiveDate };
    const previous = byCode.get(course.courseCode);
    if (previous && Object.entries(item).every(([key, value]) => JSON.stringify(previous[key]) === JSON.stringify(value))) {
      unchanged++;
    } else {
      pending.push(item);
    }
  }
  const sourceCodes = new Set([...normalized.courses.map((course) => course.courseCode), ...normalized.conflicts.map((conflict) => conflict.courseCode)]);
  const summary = {
    status: normalized.conflicts.length ? "completed_with_conflicts" : "completed",
    runId, catalogId: catalog.catalogId, effectiveDate,
    sourceRecords: catalog.records.length, uniqueCodes: normalized.uniqueCodes,
    duplicateCodes: normalized.duplicateCodes, conflicts: normalized.conflicts.map((conflict) => conflict.courseCode),
    existingCourses: existing.length, toUpsert: pending.length, unchanged, written: 0,
    previousSourceCount: previousImport?.uniqueCodes ?? null,
    missingFromSource: existing.filter((course) => !sourceCodes.has(course.courseCode)).length,
  };

  const syncedAt = new Date().toISOString();
  // Finish each batch before throwing, so the lease covers every in-flight write.
  for (let start = 0; start < pending.length; start += 8) {
    const batch = pending.slice(start, start + 8);
    const results = await Promise.allSettled(batch.map((item) => dependencies.upsertCourse({ ...item, syncedAt })));
    summary.written += results.filter((result) => result.status === "fulfilled").length;
    const failedIndex = results.findIndex((result) => result.status === "rejected");
    if (failedIndex !== -1) {
      const error = results[failedIndex].reason;
      throw new Error(`Import partially written (${summary.written}/${pending.length}). ${batch[failedIndex].courseCode}: ${error.name}: ${error.message} Rerun to finish safely.`, { cause: error });
    }
  }
  // Advance the baseline only after all course writes succeed.
  await dependencies.saveImportState(summary);
  return summary;
}

// Fetch the current undergraduate catalog.

function effectiveDateFor(event = {}) {
  if (!event || typeof event !== "object" || Array.isArray(event)) throw new Error("Event must be a JSON object.");
  const scheduled = event.scheduledTime === undefined ? new Date() : new Date(event.scheduledTime);
  if (Number.isNaN(scheduled.getTime())) throw new Error("Invalid scheduledTime.");
  const date = event.effectiveDate ?? new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(scheduled);
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      Number.isNaN(Date.parse(`${date}T00:00:00Z`)) || new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date) {
    throw new Error("effectiveDate must be a valid YYYY-MM-DD date.");
  }
  return date;
}

async function request(url, options = {}, operation = "Coursedog request") {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const response = await fetch(url, { ...options, signal: AbortSignal.timeout(30_000) });
      if (response.ok) return response;
      await response.body?.cancel();
      const error = new Error(`HTTP ${response.status}`);
      error.retryable = response.status === 429 || response.status >= 500;
      if (!error.retryable || attempt === 3) throw error;
    } catch (error) {
      if (error.retryable === false || attempt === 3) {
        throw new Error(`${operation} failed: ${error.message}`, { cause: error });
      }
    }
    await delay(500 * 2 ** attempt + Math.floor(Math.random() * 250));
  }
}

function discoverCatalogId(html) {
  const match = html.match(/<script\b[^>]*\bid="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
  if (!match) throw new Error("Catalog discovery failed: Nuxt data is missing. Set catalogId explicitly.");
  const data = JSON.parse(match[1]);
  if (!Array.isArray(data)) throw new Error("Catalog discovery failed: unexpected Nuxt data.");
  const ids = new Set();
  for (const entry of data) {
    if (entry && typeof entry === "object" && !Array.isArray(entry) &&
        Number.isInteger(entry.activeCatalog) && Number.isInteger(entry.school) && data[entry.school] === "bar01") {
      ids.add(data[entry.activeCatalog]);
    }
  }
  if (ids.size !== 1 || !/^[A-Za-z0-9_-]+$/.test([...ids][0] ?? "")) {
    throw new Error("Catalog discovery failed: expected one Baruch catalog ID. Set catalogId explicitly.");
  }
  return [...ids][0];
}

async function fetchCatalog({ effectiveDate, catalogId }) {
  const pageSize = 500;
  if (!catalogId) {
    const response = await request(`${CATALOG_ORIGIN}/courses`, {}, "Catalog discovery");
    catalogId = discoverCatalogId(await response.text());
  }
  if (typeof catalogId !== "string" || !/^[A-Za-z0-9_-]+$/.test(catalogId)) throw new Error("Invalid catalogId.");
  const filters = {
    condition: "AND",
    filters: [{
      condition: "and",
      filters: [
        ["status", "select", "Active"],
        ["catalogPrint", "boolean", true],
        ["career", "careerSelect", "Undergraduate"],
      ].map(([name, inputType, value]) => ({ condition: "field", name, inputType, group: "course", type: "is", value, customField: false })),
    }],
  };
  const records = [];
  const ids = new Set();
  let total;
  do {
    const offset = records.length;
    const params = new URLSearchParams({
      catalogId, skip: String(records.length), limit: String(pageSize), orderBy: "code,courseGroupId",
      formatDependents: "false", effectiveDatesRange: `${effectiveDate},${effectiveDate}`,
      ignoreEffectiveDating: "false", ignoreTotalCount: "false",
      columns: "code,longName,name,description,credits,courseGroupId,career,status,effectiveStartDate,effectiveEndDate",
    });
    const response = await request(`${API_URL}?${params}`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json", origin: CATALOG_ORIGIN, "x-requested-with": "catalog" },
      body: JSON.stringify(filters),
    }, `Course page at offset ${offset}`);
    let page;
    try {
      page = await response.json();
    } catch (error) {
      throw new Error(`Course page at offset ${offset} returned invalid JSON.`, { cause: error });
    }
    if (!Array.isArray(page.data) || !Number.isInteger(page.listLength) || page.listLength < 1 || page.listLength > 50_000) {
      throw new Error("Invalid or empty Coursedog response; nothing will be written.");
    }
    total ??= page.listLength;
    if (page.listLength !== total) throw new Error("Catalog count changed while fetching. Retry the import.");
    if (page.skip !== records.length || page.data.length === 0 || page.data.length > pageSize) {
      throw new Error("Unexpected Coursedog pagination; nothing will be written.");
    }
    for (const record of page.data) {
      if (!record || typeof record !== "object" || typeof record.id !== "string" || ids.has(record.id)) {
        throw new Error("Missing or repeated source ID; pagination may be incomplete.");
      }
      ids.add(record.id);
      records.push(record);
    }
    if (records.length > total) throw new Error("Source returned more courses than its total count.");
  } while (records.length < total);
  return { catalogId, effectiveDate, total, records };
}

// Clean descriptions and collapse duplicate course codes.

function normalizeDescription(value) {
  if (typeof value !== "string") throw new Error("Course description must be text.");
  return convert(value, {
    wordwrap: false,
    selectors: [{ selector: "a", options: { ignoreHref: true } }, { selector: "img", format: "skip" }],
  }).normalize("NFKC").replace(/\s+/gu, " ").trim();
}

function normalizeCatalog(records, school = "Baruch College") {
  const groups = new Map();
  for (const record of records) {
    if (record.career !== "Undergraduate" || record.status !== "Active") throw new Error("Unexpected career or status in catalog response.");
    const code = typeof record.code === "string" ? record.code.trim().replace(/\s+/gu, " ").toUpperCase() : "";
    if (!/^[A-Z][A-Z0-9&/-]* [A-Z0-9][A-Z0-9./-]*$/.test(code)) throw new Error(`Invalid course code: ${JSON.stringify(record.code)}.`);
    if (typeof record.courseGroupId !== "string" || !/^[A-Za-z0-9_-]+$/.test(record.courseGroupId)) throw new Error(`Invalid source identity for ${code}.`);
    const description = normalizeDescription(record.description);
    if (!description) throw new Error(`Empty description for ${code}; nothing will be written.`);
    const rows = groups.get(code) ?? [];
    rows.push({ record, description });
    groups.set(code, rows);
  }

  const courses = [];
  const conflicts = [];
  let duplicateCodes = 0;
  for (const [courseCode, rows] of [...groups].sort(([a], [b]) => a.localeCompare(b))) {
    if (rows.length > 1) duplicateCodes++;
    // Ignore only a terminal period when deciding whether descriptions conflict.
    const descriptions = new Set(rows.map(({ description }) => description.replace(/\.$/u, "")));
    if (descriptions.size > 1) {
      conflicts.push({ courseCode, variants: rows.map(({ record, description }) => ({ courseGroupId: record.courseGroupId, description })) });
      continue;
    }
    // Deterministic selection prevents source ordering from changing stored values.
    rows.sort((a, b) => a.record.courseGroupId.localeCompare(b.record.courseGroupId) || a.record.id.localeCompare(b.record.id));
    const { record, description } = rows[0];
    const title = [record.longName, record.name].find((value) => typeof value === "string" && value.trim());
    const credits = record.credits?.numberOfCredits;
    const course = {
      school,
      courseCode,
      description,
      title: title?.trim() || courseCode,
      credits: Number.isFinite(credits) && credits >= 0 ? credits : null,
    };
    course.sourceUrl = `${CATALOG_ORIGIN}/courses/${encodeURIComponent(record.courseGroupId)}`;
    course.sourceCourseGroupIds = [...new Set(rows.map(({ record }) => record.courseGroupId))].sort();
    courses.push(course);
  }
  return { courses, conflicts, duplicateCodes, uniqueCodes: groups.size };
}

// Prevent simultaneous imports.

async function withImportLock({ db, tableName, owner = randomUUID(), remainingTimeMs = 900_000 }, task) {
  if (!Number.isFinite(remainingTimeMs) || remainingTimeMs < 0 || remainingTimeMs > 900_000) {
    throw new Error("Invalid Lambda remaining time for import lock.");
  }
  const acquiredAt = Date.now();
  // The lease outlives this invocation's maximum runtime, including a margin.
  // A timed-out invocation cannot keep writing when a replacement takes over.
  const expiresAt = Math.ceil((acquiredAt + remainingTimeMs + 60_000) / 1000);
  try {
    await db.send(new UpdateCommand({
      TableName: tableName,
      Key: IMPORT_LOCK_KEY,
      UpdateExpression: "SET #owner = :owner, #expires = :expires",
      ConditionExpression: "attribute_not_exists(#owner) OR #expires < :now",
      ExpressionAttributeNames: { "#owner": "lockOwner", "#expires": "expiresAt" },
      ExpressionAttributeValues: { ":owner": owner, ":expires": expiresAt, ":now": Math.floor(acquiredAt / 1000) },
    }));
  } catch (error) {
    if (error.name === "ConditionalCheckFailedException") {
      throw new Error("Another course import is running. Retry after it finishes; a timed-out run's lock expires within 16 minutes.", { cause: error });
    }
    throw error;
  }
  try {
    return await task();
  } finally {
    try {
      await db.send(new DeleteCommand({
        TableName: tableName,
        Key: IMPORT_LOCK_KEY,
        ConditionExpression: "#owner = :owner",
        ExpressionAttributeNames: { "#owner": "lockOwner" },
        ExpressionAttributeValues: { ":owner": owner },
      }));
    } catch (error) {
      // Never delete a replacement owner's lease or mask the original error.
      console.warn(JSON.stringify({ event: "course_import_lock_release_failed", message: error.message, expiresAt }));
    }
  }
}
