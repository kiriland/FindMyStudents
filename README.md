# FindMyStudents

A class project using Next.js and DynamoDB. The home page shows two sample Baruch courses: CIS 3400 and CIS 4160.

## Run locally

Use Node.js 24.

```sh
npm ci --legacy-peer-deps
cp .env.example .env.local
```

The example file contains:

```env
AWS_REGION=us-east-1
DYNAMODB_TABLE_NAME=classes
```

Use an authenticated AWS profile locally. If it is a named profile, add `AWS_PROFILE=your-profile-name` to `.env.local`. Signing in to the AWS website does not sign in the local app.

Keep access keys and tokens out of the code and Git. `.env.local` is ignored; `.env.example` contains only settings. Database calls stay on the server.

```sh
npm run seed
npm run dev
```

Open http://localhost:3000. The seed script reads `data/classes.json` and skips courses that already exist.

## Database

The table is `classes` in `us-east-1`. Its partition key is `school` and sort key is `courseCode`, both String. It uses Standard storage, 1 read unit, 1 write unit, and no auto scaling.

`lib/classes.ts` queries the Baruch courses. The sample data and catalog links are in `data/classes.json`.

The app needs `dynamodb:Query`; the seed script needs `dynamodb:PutItem`. Limit these permissions to the classes table.

## Checks and deployment

Run `npm test`, `npm run lint`, and `npm run build`.

The existing workflow deploys `main` to AWS Lambda in `us-east-1`. Pushing `dummydata` does not deploy it. Set `DYNAMODB_TABLE_NAME=classes` on the runtime and give its AWS role permission to query the table.

For a manual deployment:

```sh
npm run prep:standalone
aws lambda-web deploy --name FindMyStudents --code ./.next/standalone --create
```
