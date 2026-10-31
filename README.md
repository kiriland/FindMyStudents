# FindMyStudents

A Baruch College class-finder project built with Next.js, React, TypeScript, and Node.js. This branch adds the first data connection: two sample Baruch courses stored in Amazon DynamoDB and displayed on the home page.

## What this branch includes

- A server-only DynamoDB query in `lib/classes.ts`.
- A home page with loading, empty, and connection-error states.
- Sample catalog records for CIS 3400 and CIS 4160 in `data/classes.json`.
- A seed command that skips existing records instead of overwriting them.

The course codes, titles, and credit counts come from the official [CIS 3400](https://baruch-undergraduate.catalog.cuny.edu/courses/0906121) and [CIS 4160](https://baruch-undergraduate.catalog.cuny.edu/courses/0906241/general-aoYks) catalog entries, checked October 26, 2026. Descriptions are short summaries. These are sample course records, not current sections, schedules, student rosters, or enrollment data.

## Setup

Use Node.js 24 and npm, matching the deployment workflow. Keep the versions in `package-lock.json`.

```sh
npm ci --legacy-peer-deps
cp .env.example .env.local
```

The default configuration is:

```dotenv
AWS_REGION=us-east-1
DYNAMODB_TABLE_NAME=FindMyStudents-Classes
```

Authenticate the machine running Node.js with an AWS CLI profile or an existing AWS role. Signing into the AWS console in Chrome alone does not authenticate the local app. For an IAM Identity Center profile, run `aws sso login --profile your-profile-name` and set `AWS_PROFILE=your-profile-name` in `.env.local`. Use the login method provided by the AWS account administrator if the account does not use Identity Center.

Do not put credentials in source files or `NEXT_PUBLIC_` variables. `.env.local` is ignored by Git. On AWS, give the application's runtime role permission to query this table; do not deploy personal access keys.

## DynamoDB table

Create the table in the same account as your AWS profile, in Northern Virginia (`us-east-1`), matching the deployment workflow:

| Setting | Value |
| --- | --- |
| Table name | `FindMyStudents-Classes` |
| Partition key | `school` (String) |
| Sort key | `courseCode` (String) |
| Table class | Standard |
| Capacity mode | Provisioned |
| Read / write capacity | 1 / 1 |
| Auto scaling | Off for both |
| Encryption | AWS-owned key |
| Secondary indexes | None |

Review the console cost estimate and the account's Free Tier allowance before provisioning. Keep auto scaling off for this demo.

After approving the AWS cost, you can create the table in the console or with the AWS CLI:

```sh
aws dynamodb create-table --region us-east-1 \
  --table-name FindMyStudents-Classes \
  --attribute-definitions AttributeName=school,AttributeType=S AttributeName=courseCode,AttributeType=S \
  --key-schema AttributeName=school,KeyType=HASH AttributeName=courseCode,KeyType=RANGE \
  --billing-mode PROVISIONED \
  --provisioned-throughput ReadCapacityUnits=1,WriteCapacityUnits=1
aws dynamodb wait table-exists --region us-east-1 --table-name FindMyStudents-Classes
```

Then populate and start the app:

```sh
npm run seed
npm run dev
```

Open http://localhost:3000. The page reads from DynamoDB on each request; it does not fall back to hardcoded JSON if the connection fails. The JSON file is only used by the seed command.

The runtime needs `dynamodb:Query` on this table. The seed command additionally needs `dynamodb:DescribeTable` and `dynamodb:PutItem`. Table creation needs `dynamodb:CreateTable`. Scope permissions to the table ARN wherever supported. No public database access or browser AWS credentials are needed.

## Checks

```sh
npm test
npm run lint
npm run build
```

The automated query tests use a mocked SDK and cover pagination, empty results, missing configuration, and AWS errors. They do not prove that an AWS account is connected. For a live check, run the seed with authenticated credentials, confirm both records in the AWS console, and open the home page.

## Architecture and remaining work

Browser → Next.js Server Component → AWS SDK → DynamoDB. The browser receives rendered course details, not AWS credentials. A query selects `school = Baruch College` and follows pagination; the sort key orders the course codes.

This branch covers the DynamoDB/sample-data task. Authentication, student matching, and live class sections are separate project work. A Node.js runtime is required; a static HTML export cannot execute the database query. The live deployment URL has not been verified for this branch.

DynamoDB integration and sample-data task: Yousif Elfaresi. Other team contributions remain recorded in Git history.

## Deployment

The existing workflow deploys `main` to AWS Lambda Web Functions in `us-east-1`. Pushing `dummydata` does not trigger that deployment.

To build the standalone package:

```sh
npm run prep:standalone
```

The existing manual deployment command is:

```sh
aws lambda-web deploy --name FindMyStudents --code ./.next/standalone --create
```

Before deploying this branch, configure `DYNAMODB_TABLE_NAME=FindMyStudents-Classes` on the application runtime and give its role `dynamodb:Query` permission on the table. The build workflow's credentials do not supply runtime database access. Keep the table and runtime in `us-east-1`.
