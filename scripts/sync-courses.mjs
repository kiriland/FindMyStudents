#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const event = {};
for (let i = 0; i < args.length; i++) {
  if (["--effective-date", "--catalog-id"].includes(args[i]) && args[i + 1] && !args[i + 1].startsWith("--")) {
    event[args[i] === "--effective-date" ? "effectiveDate" : "catalogId"] = args[++i];
  } else throw new Error("Usage: node scripts/sync-courses.mjs [--effective-date YYYY-MM-DD] [--catalog-id ID]");
}
const infrastructure = fileURLToPath(new URL("../infrastructure/course-importer", import.meta.url));
const outputs = JSON.parse(execFileSync("terraform", [`-chdir=${infrastructure}`, "output", "-json"], { encoding: "utf8" }));
const workDir = mkdtempSync(join(tmpdir(), "course-import-"));
try {
  const responseFile = join(workDir, "response.json");
  const metadata = JSON.parse(execFileSync("aws", [
    "lambda", "invoke", "--region", outputs.aws_region.value,
    "--function-name", outputs.function_name.value,
    "--invocation-type", "RequestResponse", "--cli-binary-format", "raw-in-base64-out",
    "--payload", JSON.stringify(event), "--cli-read-timeout", "910",
    "--output", "json", "--no-cli-pager", responseFile,
  ], { encoding: "utf8", maxBuffer: 1024 * 1024 }));
  const response = JSON.parse(readFileSync(responseFile, "utf8"));
  console.log(JSON.stringify(response, null, 2));
  if (metadata.FunctionError || metadata.StatusCode !== 200) process.exitCode = 1;
} finally {
  rmSync(workDir, { recursive: true, force: true });
}
