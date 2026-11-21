import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringOutput(outputs: unknown, name: string): string {
  const output = isRecord(outputs) ? outputs[name] : undefined;
  if (!isRecord(output) || typeof output.value !== "string") {
    throw new Error(`Terraform output ${name} is missing.`);
  }
  return output.value;
}

const FLAGS = new Map([
  ["--effective-date", "effectiveDate"],
  ["--catalog-id", "catalogId"],
]);

const args = process.argv.slice(2);
const event: Record<string, string> = {};
for (let i = 0; i < args.length; i++) {
  const field = FLAGS.get(args[i] ?? "");
  const value = args[i + 1];
  if (field && value && !value.startsWith("--")) {
    event[field] = value;
    i++;
  } else {
    throw new Error(
      "Usage: node scripts/sync-courses.ts [--effective-date YYYY-MM-DD] [--catalog-id ID]",
    );
  }
}
const infrastructure = fileURLToPath(
  new URL("../infrastructure/course-importer", import.meta.url),
);
const outputs: unknown = JSON.parse(
  execFileSync("terraform", [`-chdir=${infrastructure}`, "output", "-json"], {
    encoding: "utf8",
  }),
);
const region = stringOutput(outputs, "aws_region");
const functionName = stringOutput(outputs, "function_name");
const workDir = mkdtempSync(join(tmpdir(), "course-import-"));
try {
  const responseFile = join(workDir, "response.json");
  const metadata: unknown = JSON.parse(
    execFileSync(
      "aws",
      [
        "lambda",
        "invoke",
        "--region",
        region,
        "--function-name",
        functionName,
        "--invocation-type",
        "RequestResponse",
        "--cli-binary-format",
        "raw-in-base64-out",
        "--payload",
        JSON.stringify(event),
        "--cli-read-timeout",
        "910",
        "--output",
        "json",
        "--no-cli-pager",
        responseFile,
      ],
      { encoding: "utf8", maxBuffer: 1024 * 1024 },
    ),
  );
  const response: unknown = JSON.parse(readFileSync(responseFile, "utf8"));
  console.log(JSON.stringify(response, null, 2));
  if (
    !isRecord(metadata) ||
    Boolean(metadata.FunctionError) ||
    metadata.StatusCode !== 200
  ) {
    process.exitCode = 1;
  }
} finally {
  rmSync(workDir, { recursive: true, force: true });
}
