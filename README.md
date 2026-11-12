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
└── classes/          # Course queries and class-list components
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

The app reads the existing `classes` table in `us-east-1`. No seed command is needed. `data/classes.json` is a reference copy of the two sample courses, not the app's data source.

The table uses `school` as the partition key and `courseCode` as the sort key, both String. The AWS connection stays in `lib/dynamodb.ts`; course queries and UI stay in `features/classes/`.

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
