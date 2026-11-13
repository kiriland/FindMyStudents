## Deployment

To package and deploy the application to AWS Lambda Web Functions, run the following commands:

1. **Build and prepare the standalone package:**
   ```bash
   npm run prep:standalone
   ```
2. Deploy to AWS Lambda Web Functions:
   ```bash
   aws lambda-web deploy --name FindMyStudents --code ./.next/standalone --create
   ```

### GitHub Actions configuration

The deployment workflow builds and deploys pushes to `main`, and can also be run
manually from the Actions tab. In **Settings → Secrets and variables → Actions**,
configure these repository values:

| Storage | Name | Purpose |
| --- | --- | --- |
| Secret | `AWS_DEPLOY_ROLE_ARN` | Deployment role assumed through GitHub OIDC |
| Secret | `AWS_LAMBDA_EXECUTION_ROLE_ARN` | Role used by the running Web Function |
| Secret | `TURNSTILE_SECRET_KEY` | Private Cloudflare verification key; deployment only |
| Variable | `DYNAMODB_TABLE_NAME` | `classes` |
| Variable | `NEXT_PUBLIC_COGNITO_USER_POOL_ID` | Public Cognito pool ID |
| Variable | `NEXT_PUBLIC_COGNITO_CLIENT_ID` | Public Cognito app client ID |
| Variable | `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Public Cloudflare widget key |
| Variable | `TURNSTILE_ALLOWED_HOSTNAMES` | Comma-separated production hostnames, without protocols or ports |

Keep the Turnstile secret out of Variables, source files, and build-time env.
If it was previously printed in an Actions log, rotate it in Cloudflare and
store the replacement as a GitHub Secret, then remove the old Variable.
`NEXT_PUBLIC_*` values are embedded in browser JavaScript when Next.js builds;
storing them as Secrets cannot hide them from visitors. Role ARNs are identifiers,
not AWS credentials, but the workflow keeps the existing Secret storage for them.

The workflow obtains short-lived AWS credentials through OIDC after building;
no `AWS_ACCESS_KEY_ID` or `AWS_SECRET_ACCESS_KEY` repository secrets are needed.
Restrict the AWS deployment role's OIDC trust to audience `sts.amazonaws.com` and
subject `repo:kiriland/FindMyStudents:ref:refs/heads/main`. A manual run from another
branch should therefore fail authentication. The deployment role needs the Web
Function deployment permissions and permission to pass the execution role.

The Turnstile secret is passed as a quoted shell environment variable to the
deployment command and stored in Lambda's runtime environment. GitHub masks
configured secrets in logs; do not enable shell tracing (`set -x`), AWS CLI debug
logging, or print environment variables. Authorized workflow code and AWS
principals with access to the runtime configuration can still access it. For
runtime-only secret retrieval and independent rotation, use AWS Secrets Manager
with application-side retrieval instead.

## Project structure

The application is a modular monolith: one deployable Next.js application with
business concerns grouped into feature modules.

```text
app/                 # Routes and layouts only
├── (auth)/           # Login, signup, and confirmation routes
└── (dashboard)/      # Authenticated dashboard
components/           # Shared UI primitives
features/
├── auth/             # Cognito auth client and auth-specific components
└── dashboard/        # Course queries and dashboard components
lib/                 # Shared infrastructure configuration
```

## Local setup

Use Node.js 24.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Fill in the Cognito pool and client IDs in `.env.local` and use an authenticated AWS profile. For a named profile, add `AWS_PROFILE=your-profile-name`. Keep credentials out of Git.

## Class data

To deploy the scheduled undergraduate catalog importer and run the first sync,
use `./scripts/deploy-course-importer.sh`. See
[the importer setup and operations guide](infrastructure/course-importer/README.md)
for prerequisites, four semester schedules, and manual console runs.

The app reads the existing `classes` table in `us-east-1`. No seed command is needed. `data/classes.json` is a reference copy of the two sample courses, not the app's data source.

The table uses `school` as the partition key and `courseCode` as the sort key, both String. The AWS connection stays in `lib/dynamodb.ts`; course queries and UI stay in `features/dashboard/`.

Set `DYNAMODB_TABLE_NAME=classes` on the deployed runtime and give its role `dynamodb:Query` permission on this table. AWS credentials are used only on the server.

Run `npx next typegen`, `npx tsc --noEmit`, and `npm run prep:standalone` before merging.

## Turnstile on login and sign-up

Create a **Managed** widget in the [Cloudflare Turnstile dashboard](https://dash.cloudflare.com/?to=/:account/turnstile)
and register your app's hostnames (including `localhost` for local development).
Set these environment variables:

```dotenv
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your-public-site-key
TURNSTILE_SECRET_KEY=your-private-secret-key
TURNSTILE_ALLOWED_HOSTNAMES=localhost,your-domain.example
```

The site key is embedded at build time; keep the secret on the server only.
Allowed hostnames are comma-separated names without protocols or ports.
The server needs outbound HTTPS access to `challenges.cloudflare.com`.

Turnstile runs inside the login and sign-up forms, showing a challenge only when
Cloudflare requires interaction. Its widget is removed when the form unmounts;
the shared script stays available but no widget runs on other pages. The server
validates the token, action, and hostname through Cloudflare's Siteverify API.
Tokens expire after five minutes and are refreshed automatically. Each submission
attempt resets the widget so the next attempt uses a fresh token. Verification
failures stop submission; they do not bypass the check. No Cognito triggers or
additional status UI are used.

This protects the app's forms. Cognito's public app client remains directly
accessible, so callers can bypass the forms and verification endpoint. Enforcing
Turnstile for all authentication requires Cognito-side controls or a separate
server-mediated authentication architecture.
