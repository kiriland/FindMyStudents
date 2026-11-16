# Baruch course importer

EventBridge Scheduler starts Lambda four times a year. Lambda fetches active,
published undergraduate courses from Coursedog, deduplicates them by course code,
and updates the existing DynamoDB table. You can also sync manually.

## Deploy

Requires Node.js 24+, npm, Terraform 1.6+, AWS CLI v2, and authenticated AWS access.
The default target is the existing `classes` table in `us-east-1`, with String
keys `school` (partition) and `courseCode` (sort). Terraform checks the table
schema and on-demand billing mode but does not create or manage the table.

From the repository root:

```bash
# Optional: select an already-configured profile.
export AWS_PROFILE=your-profile

# Optional: customize the table, region, catalog override, or schedule dates.
cp infrastructure/course-importer/terraform.tfvars.example \
   infrastructure/course-importer/terraform.tfvars

./scripts/deploy-course-importer.sh
```

The command builds the Lambda package and shows the Terraform plan. After you
approve it, it deploys, opens the Lambda console, and performs a sync. To deploy
without syncing or opening the console:

```bash
SKIP_INITIAL_SYNC=1 OPEN_AWS_CONSOLE=0 ./scripts/deploy-course-importer.sh
```

If the existing table still uses provisioned capacity, switch it once before
using the importer. This preserves the table's keys and records:

```bash
aws dynamodb update-table --region us-east-1 --table-name classes \
  --billing-mode PAY_PER_REQUEST
aws dynamodb wait table-exists --region us-east-1 --table-name classes
```

## Run

```bash
node scripts/sync-courses.mjs
```

Optional overrides: `--effective-date YYYY-MM-DD` and `--catalog-id ID`.
By default, the function discovers the current catalog from the public website
and uses today's New York date. Scheduled retries retain the original scheduled
date. Imports older than already-imported data are rejected; use a separate table
for historical data.

Every invocation performs a sync. In the Lambda console's **Test** tab, invoke
with `{}`. Optional event fields are `effectiveDate` and `catalogId`.

## Schedules

Defaults run at 06:00 America/New_York on January 2, January 25, June 1, and
August 28. These are approximate refresh dates, not an official academic calendar.
Edit `semester_schedules` and redeploy to change them. Set `schedules_enabled`
to false to keep manual imports only.

Each run refreshes the entire catalog, not semester sections or class schedules.

## Data and safeguards

- One course item per `school = "Baruch College"` and normalized `courseCode`.
- Descriptions become plain text. Matching descriptions collapse; a terminal
  period is ignored during duplicate comparison. Conflicting codes are skipped
  and reported, preserving their existing records.
- Title, credits, and catalog links remain for the dashboard. Missing titles
  fall back to the code; missing credits are null.
- Unchanged records are skipped. New effective dates still update provenance.
  Missing courses are retained and counted as `missingFromSource`.
- All source pages must be complete before course updates. The importer requires
  at least 1,000 codes and rejects drops over 20% from the previous successful
  source count. These constants live in `services/course-importer/src/index.mjs`.
- The source-count checkpoint and expiring import lock use the separate
  `__course_importer__` partition, outside the website's course query. The first
  successful run establishes the count baseline.
- A lock prevents overlapping imports. It is released on completion or failure;
  after a terminated invocation, it becomes reusable within 16 minutes.
- Writes run eight at a time with SDK retries. Changes are per course, not one
  transaction. Fix a failure's cause and rerun to finish remaining updates.

The function returns and logs counts of written, unchanged, conflicting, and
missing courses. It uploads no files. Scheduled delivery/execution failures have
bounded retries and go to the SQS failure queue after retries are exhausted.
There are no alarms or automatic notifications; inspect Lambda logs and the queue.

Terraform manages Lambda, IAM roles, four schedules, the failure queue, and logs.
Keep the ignored local Terraform state files; scripts read them to locate Lambda.
Configure shared remote state before deploying collaboratively. Never delete
state and redeploy the same resource names.

## Static checks

```bash
npm run build --prefix services/course-importer
node --check services/course-importer/src/index.mjs
npx tsc --noEmit
bash -n scripts/deploy-course-importer.sh
terraform -chdir=infrastructure/course-importer fmt -check
terraform -chdir=infrastructure/course-importer validate
```

There are no automated tests or test-running deployment steps.
