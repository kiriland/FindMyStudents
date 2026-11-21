import { DescribeTableCommand, DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { convert } from "html-to-text";
import { randomUUID } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";

const CATALOG_ORIGIN = "https://baruch-undergraduate.catalog.cuny.edu";
const API_URL =
  "https://app.coursedog.com/api/v1/cm/bar01/courses/search/%24filters";
const MINIMUM_COURSES = 1000;
const MAXIMUM_DROP_FRACTION = 0.2;
// A separate partition keeps coordination metadata out of the app's course query.
const IMPORT_LOCK_KEY = {
  school: "__course_importer__",
  courseCode: "Baruch College",
};
const dynamo = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
  maxAttempts: 8,
  retryMode: "adaptive",
});
const db = DynamoDBDocumentClient.from(dynamo);
const IMPORT_STATE_KEY = {
  school: "__course_importer__",
  courseCode: "Baruch College#last-success",
};

type LambdaContext = {
  awsRequestId?: string;
  getRemainingTimeInMillis?: () => number;
};

type ImportRequest = { effectiveDate: string; catalogId: unknown };

type StoredItem = Record<string, unknown>;

type ImportState = { uniqueCodes: number; effectiveDate: unknown };

type SourceRecord = Record<string, unknown> & { id: string };

type Course = {
  school: string;
  courseCode: string;
  description: string;
  title: string;
  credits: number | null;
  sourceUrl: string;
  sourceCourseGroupIds: string[];
};

type CourseItem = Course & {
  sourceCatalogId: string;
  sourceEffectiveDate: string;
};

type Conflict = {
  courseCode: string;
  variants: { courseGroupId: string; description: string }[];
};

type ImportSummary = {
  status: "completed" | "completed_with_conflicts";
  runId: string;
  catalogId: string;
  effectiveDate: string;
  sourceRecords: number;
  uniqueCodes: number;
  duplicateCodes: number;
  conflicts: string[];
  existingCourses: number;
  toUpsert: number;
  unchanged: number;
  written: number;
  previousSourceCount: number | null;
  missingFromSource: number;
};

type SyncDependencies = {
  runId?: string;
  getImportState: () => Promise<StoredItem | undefined>;
  saveImportState: (summary: ImportSummary) => Promise<void>;
  listCourses: () => Promise<StoredItem[]>;
  upsertCourse: (item: CourseItem & { syncedAt: string }) => Promise<void>;
};

class HttpError extends Error {
  readonly retryable: boolean;

  constructor(status: number) {
    super(`HTTP ${String(status)}`);
    this.retryable = status === 429 || status >= 500;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function errorName(error: unknown) {
  return error instanceof Error ? error.name : "Error";
}

export async function handler(
  event: unknown = {},
  context: LambdaContext = {},
) {
  const effectiveDate = effectiveDateFor(event);
  const importRequest: ImportRequest = {
    effectiveDate,
    catalogId:
      (isRecord(event) ? event.catalogId : undefined) ??
      (process.env.CATALOG_ID || undefined),
  };
  const tableName = process.env.DYNAMODB_TABLE_NAME;
  if (!tableName) {
    throw new Error("DYNAMODB_TABLE_NAME is required.");
  }
  const { Table } = await dynamo.send(
    new DescribeTableCommand({ TableName: tableName }),
  );
  // Terraform checks the table keys; check capacity here in case it was changed later.
  if (Table?.BillingModeSummary?.BillingMode !== "PAY_PER_REQUEST") {
    throw new Error(
      `Table ${tableName} must use on-demand (PAY_PER_REQUEST) capacity for bulk imports. Switch its billing mode before retrying; no courses were written.`,
    );
  }
  try {
    const summary = await withImportLock(
      {
        tableName,
        owner: context.awsRequestId,
        remainingTimeMs: context.getRemainingTimeInMillis?.() ?? 900_000,
      },
      async () =>
        syncCourses(importRequest, {
          runId: context.awsRequestId,
          async getImportState() {
            const result = await db.send(
              new GetCommand({
                TableName: tableName,
                Key: IMPORT_STATE_KEY,
                ConsistentRead: true,
              }),
            );
            return result.Item;
          },
          async saveImportState(summary) {
            await db.send(
              new UpdateCommand({
                TableName: tableName,
                Key: IMPORT_STATE_KEY,
                UpdateExpression:
                  "SET uniqueCodes = :count, effectiveDate = :date",
                ExpressionAttributeValues: {
                  ":count": summary.uniqueCodes,
                  ":date": summary.effectiveDate,
                },
              }),
            );
          },
          async listCourses() {
            const courses: StoredItem[] = [];
            let ExclusiveStartKey: StoredItem | undefined;
            do {
              const page = await db.send(
                new QueryCommand({
                  TableName: tableName,
                  KeyConditionExpression: "#school = :school",
                  ExpressionAttributeNames: { "#school": "school" },
                  ExpressionAttributeValues: { ":school": "Baruch College" },
                  ConsistentRead: true,
                  ExclusiveStartKey,
                }),
              );
              courses.push(...(page.Items ?? []));
              ExclusiveStartKey = page.LastEvaluatedKey;
            } while (ExclusiveStartKey);
            return courses;
          },
          async upsertCourse(item) {
            const remaining = context.getRemainingTimeInMillis?.();
            if (remaining !== undefined && remaining < 20_000) {
              throw new Error(
                "Stopping before Lambda timeout; rerun to finish remaining updates.",
              );
            }
            const { school, courseCode, ...fields } = item;
            const entries = Object.entries(fields);
            await db.send(
              new UpdateCommand({
                TableName: tableName,
                Key: { school, courseCode },
                UpdateExpression: `SET ${entries.map((_, i) => `#f${String(i)} = :v${String(i)}`).join(", ")}`,
                ExpressionAttributeNames: Object.fromEntries(
                  entries.map(([key], i) => [`#f${String(i)}`, key]),
                ),
                ExpressionAttributeValues: Object.fromEntries(
                  entries.map(([, value], i) => [`:v${String(i)}`, value]),
                ),
              }),
            );
          },
        }),
    );
    console.log(
      JSON.stringify({ event: "course_import_finished", ...summary }),
    );
    return summary;
  } catch (error) {
    const cause =
      error instanceof Error && isRecord(error.cause) ? error.cause : undefined;
    console.error(
      JSON.stringify({
        event: "course_import_failed",
        message: errorMessage(error),
        cause: cause?.message,
        causeType: cause?.name,
        requestId: isRecord(cause?.$metadata)
          ? cause.$metadata.requestId
          : undefined,
        throttlingReasons: cause?.ThrottlingReasons,
      }),
    );
    throw error;
  }
}

// Compare the catalog with stored courses and apply changes.

function readImportState(
  item: StoredItem | undefined,
): ImportState | undefined {
  if (!item) {
    return undefined;
  }
  const { uniqueCodes, effectiveDate } = item;
  if (
    typeof uniqueCodes !== "number" ||
    !Number.isInteger(uniqueCodes) ||
    uniqueCodes < 1
  ) {
    throw new Error(
      "Previous import metadata has an invalid source count; nothing will be written.",
    );
  }
  return { uniqueCodes, effectiveDate };
}

function isLaterDate(value: unknown, effectiveDate: string) {
  return typeof value === "string" && value > effectiveDate;
}

async function syncCourses(
  { effectiveDate, catalogId }: ImportRequest,
  dependencies: SyncDependencies,
): Promise<ImportSummary> {
  const runId = dependencies.runId ?? randomUUID();
  const catalog = await fetchCatalog({ effectiveDate, catalogId });
  const normalized = normalizeCatalog(catalog.records);
  if (normalized.uniqueCodes < MINIMUM_COURSES) {
    throw new Error(
      `Only ${String(normalized.uniqueCodes)} course codes returned; minimum is ${String(MINIMUM_COURSES)}. No writes performed.`,
    );
  }
  const existing = await dependencies.listCourses();
  const byCode = new Map(existing.map((course) => [course.courseCode, course]));
  const previousImport = readImportState(await dependencies.getImportState());
  // Retired codes stay in the table, so compare source counts, not inventory.
  // Before the first checkpoint exists, the absolute minimum still guards writes.
  if (
    previousImport &&
    normalized.uniqueCodes <
      previousImport.uniqueCodes * (1 - MAXIMUM_DROP_FRACTION)
  ) {
    throw new Error(
      "Catalog count dropped by more than 20%. No writes performed; investigate the source before lowering the guard.",
    );
  }
  if (
    isLaterDate(previousImport?.effectiveDate, effectiveDate) ||
    existing.some((course) =>
      isLaterDate(course.sourceEffectiveDate, effectiveDate),
    )
  ) {
    throw new Error(
      "This effectiveDate is older than a previous import. Use a separate table for historical imports.",
    );
  }
  const pending: CourseItem[] = [];
  let unchanged = 0;
  for (const course of normalized.courses) {
    const item: CourseItem = {
      ...course,
      sourceCatalogId: catalog.catalogId,
      sourceEffectiveDate: effectiveDate,
    };
    const previous = byCode.get(course.courseCode);
    if (
      previous &&
      Object.entries(item).every(
        ([key, value]) =>
          JSON.stringify(previous[key]) === JSON.stringify(value),
      )
    ) {
      unchanged++;
    } else {
      pending.push(item);
    }
  }
  const sourceCodes = new Set<unknown>([
    ...normalized.courses.map((course) => course.courseCode),
    ...normalized.conflicts.map((conflict) => conflict.courseCode),
  ]);
  const summary: ImportSummary = {
    status:
      normalized.conflicts.length > 0
        ? "completed_with_conflicts"
        : "completed",
    runId,
    catalogId: catalog.catalogId,
    effectiveDate,
    sourceRecords: catalog.records.length,
    uniqueCodes: normalized.uniqueCodes,
    duplicateCodes: normalized.duplicateCodes,
    conflicts: normalized.conflicts.map((conflict) => conflict.courseCode),
    existingCourses: existing.length,
    toUpsert: pending.length,
    unchanged,
    written: 0,
    previousSourceCount: previousImport?.uniqueCodes ?? null,
    missingFromSource: existing.filter(
      (course) => !sourceCodes.has(course.courseCode),
    ).length,
  };
  const syncedAt = new Date().toISOString();
  // Finish each batch before throwing, so the lease covers every in-flight write.
  for (let start = 0; start < pending.length; start += 8) {
    const batch = pending.slice(start, start + 8);
    const results = await Promise.allSettled(
      batch.map((item) => dependencies.upsertCourse({ ...item, syncedAt })),
    );
    summary.written += results.filter(
      (result) => result.status === "fulfilled",
    ).length;
    const failedIndex = results.findIndex(
      (result) => result.status === "rejected",
    );
    const failed = results[failedIndex];
    if (failed?.status === "rejected") {
      const error: unknown = failed.reason;
      throw new Error(
        `Import partially written (${String(summary.written)}/${String(pending.length)}). ${batch[failedIndex]?.courseCode ?? ""}: ${errorName(error)}: ${errorMessage(error)} Rerun to finish safely.`,
        { cause: error },
      );
    }
  }
  // Advance the baseline only after all course writes succeed.
  await dependencies.saveImportState(summary);
  return summary;
}

// Fetch the current undergraduate catalog.

function effectiveDateFor(event: unknown = {}) {
  if (!isRecord(event)) {
    throw new Error("Event must be a JSON object.");
  }
  const scheduled =
    event.scheduledTime === undefined
      ? new Date()
      : new Date(event.scheduledTime as string | number);
  if (Number.isNaN(scheduled.getTime())) {
    throw new TypeError("Invalid scheduledTime.");
  }
  const date =
    event.effectiveDate ??
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(scheduled);
  if (
    typeof date !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    Number.isNaN(Date.parse(`${date}T00:00:00Z`)) ||
    new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date
  ) {
    throw new Error("effectiveDate must be a valid YYYY-MM-DD date.");
  }
  return date;
}

async function request(
  url: string,
  options: RequestInit = {},
  operation = "Coursedog request",
): Promise<Response> {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(30_000),
      });
      if (response.ok) {
        return response;
      }
      await response.body?.cancel();
      const error = new HttpError(response.status);
      if (!error.retryable || attempt === 3) {
        throw error;
      }
    } catch (error) {
      if ((error instanceof HttpError && !error.retryable) || attempt === 3) {
        throw new Error(`${operation} failed: ${errorMessage(error)}`, {
          cause: error,
        });
      }
    }
    await delay(500 * 2 ** attempt + Math.floor(Math.random() * 250));
  }
  throw new Error(`${operation} failed.`);
}

function discoverCatalogId(html: string) {
  const match =
    /<script\b[^>]*\bid="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i.exec(html);
  if (!match) {
    throw new Error(
      "Catalog discovery failed: Nuxt data is missing. Set catalogId explicitly.",
    );
  }
  const data: unknown = JSON.parse(match[1] ?? "");
  if (!Array.isArray(data)) {
    throw new TypeError("Catalog discovery failed: unexpected Nuxt data.");
  }
  const ids = new Set<unknown>();
  for (const entry of data as unknown[]) {
    if (
      isRecord(entry) &&
      typeof entry.activeCatalog === "number" &&
      Number.isInteger(entry.activeCatalog) &&
      typeof entry.school === "number" &&
      Number.isInteger(entry.school) &&
      data[entry.school] === "bar01"
    ) {
      ids.add(data[entry.activeCatalog]);
    }
  }
  const [id] = ids;
  if (
    ids.size !== 1 ||
    typeof id !== "string" ||
    !/^[A-Za-z0-9_-]+$/.test(id)
  ) {
    throw new Error(
      "Catalog discovery failed: expected one Baruch catalog ID. Set catalogId explicitly.",
    );
  }
  return id;
}

async function fetchCatalog({
  effectiveDate,
  catalogId: requestedCatalogId,
}: ImportRequest) {
  const pageSize = 500;
  let catalogId = requestedCatalogId;
  if (!catalogId) {
    const response = await request(
      `${CATALOG_ORIGIN}/courses`,
      {},
      "Catalog discovery",
    );
    catalogId = discoverCatalogId(await response.text());
  }
  if (typeof catalogId !== "string" || !/^[A-Za-z0-9_-]+$/.test(catalogId)) {
    throw new Error("Invalid catalogId.");
  }
  const filters = {
    condition: "AND",
    filters: [
      {
        condition: "and",
        filters: (
          [
            ["status", "select", "Active"],
            ["catalogPrint", "boolean", true],
            ["career", "careerSelect", "Undergraduate"],
          ] as const
        ).map(([name, inputType, value]) => ({
          condition: "field",
          name,
          inputType,
          group: "course",
          type: "is",
          value,
          customField: false,
        })),
      },
    ],
  };
  const records: SourceRecord[] = [];
  const ids = new Set<string>();
  let total: number | undefined;
  do {
    const offset = records.length;
    const params = new URLSearchParams({
      catalogId,
      skip: String(records.length),
      limit: String(pageSize),
      orderBy: "code,courseGroupId",
      formatDependents: "false",
      effectiveDatesRange: `${effectiveDate},${effectiveDate}`,
      ignoreEffectiveDating: "false",
      ignoreTotalCount: "false",
      columns:
        "code,longName,name,description,credits,courseGroupId,career,status,effectiveStartDate,effectiveEndDate",
    });
    const response = await request(
      `${API_URL}?${params.toString()}`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
          origin: CATALOG_ORIGIN,
          "x-requested-with": "catalog",
        },
        body: JSON.stringify(filters),
      },
      `Course page at offset ${String(offset)}`,
    );
    let page: unknown;
    try {
      page = await response.json();
    } catch (error) {
      throw new Error(
        `Course page at offset ${String(offset)} returned invalid JSON.`,
        { cause: error },
      );
    }
    if (
      !isRecord(page) ||
      !Array.isArray(page.data) ||
      typeof page.listLength !== "number" ||
      !Number.isInteger(page.listLength) ||
      page.listLength < 1 ||
      page.listLength > 50_000
    ) {
      throw new Error(
        "Invalid or empty Coursedog response; nothing will be written.",
      );
    }
    const data = page.data as unknown[];
    total ??= page.listLength;
    if (page.listLength !== total) {
      throw new Error(
        "Catalog count changed while fetching. Retry the import.",
      );
    }
    if (
      page.skip !== records.length ||
      data.length === 0 ||
      data.length > pageSize
    ) {
      throw new Error(
        "Unexpected Coursedog pagination; nothing will be written.",
      );
    }
    for (const record of data) {
      if (
        !isRecord(record) ||
        typeof record.id !== "string" ||
        ids.has(record.id)
      ) {
        throw new Error(
          "Missing or repeated source ID; pagination may be incomplete.",
        );
      }
      ids.add(record.id);
      records.push(record as SourceRecord);
    }
    if (records.length > total) {
      throw new Error("Source returned more courses than its total count.");
    }
  } while (records.length < total);
  return { catalogId, effectiveDate, total, records };
}

// Clean descriptions and collapse duplicate course codes.

function normalizeDescription(value: unknown) {
  if (typeof value !== "string") {
    throw new TypeError("Course description must be text.");
  }
  return convert(value, {
    wordwrap: false,
    selectors: [
      { selector: "a", options: { ignoreHref: true } },
      { selector: "img", format: "skip" },
    ],
  })
    .normalize("NFKC")
    .replaceAll(/\s+/gu, " ")
    .trim();
}

type SourceRow = {
  record: SourceRecord;
  courseGroupId: string;
  description: string;
};

function normalizeCatalog(records: SourceRecord[], school = "Baruch College") {
  const groups = new Map<string, SourceRow[]>();
  for (const record of records) {
    if (record.career !== "Undergraduate" || record.status !== "Active") {
      throw new Error("Unexpected career or status in catalog response.");
    }
    const code =
      typeof record.code === "string"
        ? record.code.trim().replaceAll(/\s+/gu, " ").toUpperCase()
        : "";
    if (!/^[A-Z][A-Z0-9&/-]* [A-Z0-9][A-Z0-9./-]*$/.test(code)) {
      throw new Error(`Invalid course code: ${JSON.stringify(record.code)}.`);
    }
    const { courseGroupId } = record;
    if (
      typeof courseGroupId !== "string" ||
      !/^[A-Za-z0-9_-]+$/.test(courseGroupId)
    ) {
      throw new Error(`Invalid source identity for ${code}.`);
    }
    const description = normalizeDescription(record.description);
    if (!description) {
      throw new Error(
        `Empty description for ${code}; nothing will be written.`,
      );
    }
    const rows = groups.get(code) ?? [];
    rows.push({ record, courseGroupId, description });
    groups.set(code, rows);
  }

  const courses: Course[] = [];
  const conflicts: Conflict[] = [];
  let duplicateCodes = 0;
  for (const [courseCode, rows] of [...groups].toSorted(([a], [b]) =>
    a.localeCompare(b),
  )) {
    if (rows.length > 1) {
      duplicateCodes++;
    }
    // Ignore only a terminal period when deciding whether descriptions conflict.
    const descriptions = new Set(
      rows.map(({ description }) => description.replace(/\.$/u, "")),
    );
    if (descriptions.size > 1) {
      conflicts.push({
        courseCode,
        variants: rows.map(({ courseGroupId, description }) => ({
          courseGroupId,
          description,
        })),
      });
      continue;
    }
    // Deterministic selection prevents source ordering from changing stored values.
    const [first] = rows.toSorted(
      (a, b) =>
        a.courseGroupId.localeCompare(b.courseGroupId) ||
        a.record.id.localeCompare(b.record.id),
    );
    if (!first) {
      continue;
    }
    const { record, courseGroupId, description } = first;
    const title = [record.longName, record.name].find(
      (value): value is string => typeof value === "string" && !!value.trim(),
    );
    const credits = isRecord(record.credits)
      ? record.credits.numberOfCredits
      : undefined;
    courses.push({
      school,
      courseCode,
      description,
      title: title?.trim() || courseCode,
      credits:
        typeof credits === "number" && Number.isFinite(credits) && credits >= 0
          ? credits
          : null,
      sourceUrl: `${CATALOG_ORIGIN}/courses/${encodeURIComponent(courseGroupId)}`,
      sourceCourseGroupIds: [
        ...new Set(rows.map((row) => row.courseGroupId)),
      ].toSorted(),
    });
  }
  return { courses, conflicts, duplicateCodes, uniqueCodes: groups.size };
}

// Prevent simultaneous imports.

async function withImportLock<T>(
  {
    tableName,
    owner = randomUUID(),
    remainingTimeMs = 900_000,
  }: { tableName: string; owner?: string; remainingTimeMs?: number },
  task: () => Promise<T>,
): Promise<T> {
  if (
    !Number.isFinite(remainingTimeMs) ||
    remainingTimeMs < 0 ||
    remainingTimeMs > 900_000
  ) {
    throw new Error("Invalid Lambda remaining time for import lock.");
  }
  const acquiredAt = Date.now();
  // The lease outlives this invocation's maximum runtime, including a margin.
  // A timed-out invocation cannot keep writing when a replacement takes over.
  const expiresAt = Math.ceil((acquiredAt + remainingTimeMs + 60_000) / 1000);
  try {
    await db.send(
      new UpdateCommand({
        TableName: tableName,
        Key: IMPORT_LOCK_KEY,
        UpdateExpression: "SET #owner = :owner, #expires = :expires",
        ConditionExpression: "attribute_not_exists(#owner) OR #expires < :now",
        ExpressionAttributeNames: {
          "#owner": "lockOwner",
          "#expires": "expiresAt",
        },
        ExpressionAttributeValues: {
          ":owner": owner,
          ":expires": expiresAt,
          ":now": Math.floor(acquiredAt / 1000),
        },
      }),
    );
  } catch (error) {
    if (errorName(error) === "ConditionalCheckFailedException") {
      throw new Error(
        "Another course import is running. Retry after it finishes; a timed-out run's lock expires within 16 minutes.",
        { cause: error },
      );
    }
    throw error;
  }
  try {
    return await task();
  } finally {
    try {
      await db.send(
        new DeleteCommand({
          TableName: tableName,
          Key: IMPORT_LOCK_KEY,
          ConditionExpression: "#owner = :owner",
          ExpressionAttributeNames: { "#owner": "lockOwner" },
          ExpressionAttributeValues: { ":owner": owner },
        }),
      );
    } catch (error) {
      // Never delete a replacement owner's lease or mask the original error.
      console.warn(
        JSON.stringify({
          event: "course_import_lock_release_failed",
          message: errorMessage(error),
          expiresAt,
        }),
      );
    }
  }
}
