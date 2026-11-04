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
npm ci --legacy-peer-deps
cp .env.example .env.local
npm run dev
```

Fill in the Cognito pool and client IDs in `.env.local` and use an authenticated AWS profile. For a named profile, add `AWS_PROFILE=your-profile-name`. Keep credentials out of Git.

## Styling

Style everything with Tailwind utilities in `className`. Don't add CSS Modules or per-feature stylesheets; `app/globals.css` is the only CSS file.

- Use Tailwind's `zinc` palette, and pair each color with a `dark:` variant: `text-zinc-600 dark:text-zinc-300` for secondary text, `border-zinc-300 dark:border-zinc-700` for borders.
- Use `Button` and `Input` from `components/`. For a link that looks like a button, use `buttonClass()`.
- Cards are `rounded-xl border border-zinc-300 p-6 dark:border-zinc-700`.

## Class data

The app reads the existing `classes` table in `us-east-1`. No seed command is needed. `data/classes.json` is a reference copy of the two sample courses, not the app's data source.

The table uses `school` as the partition key and `courseCode` as the sort key, both String. The AWS connection stays in `lib/dynamodb.ts`; course queries and UI stay in `features/classes/`.

Set `DYNAMODB_TABLE_NAME=classes` on the deployed runtime and give its role `dynamodb:Query` permission on this table. AWS credentials are used only on the server.

Run `npm run lint`, `npx next typegen`, `npx tsc --noEmit`, and `npm run prep:standalone` before merging.
