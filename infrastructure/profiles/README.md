# Profiles infrastructure

Terraform for student Profiles:

- a new Cognito user pool. Email is the username and must be verified. First
  name (`given_name`) and last name (`family_name`) are required.
- the public web app client that Amplify uses in the browser
- the `findmystudents-profiles` DynamoDB table, with one item per Profile and
  one item per Help Offer in the student's partition
- the table's `course-volunteers` index, which lists a Course's Volunteers
  newest Help Offer first. Only Help Offer items are in it.
- the private `<name>-pictures-<account id>` bucket for profile pictures, with
  public access blocked, CORS for uploads from the app's origins, and a
  lifecycle rule that deletes unconfirmed uploads in `quarantine/` after 1 day
- an inline policy, `<name>-pictures`, on the app's Web Function execution role,
  giving it access to `quarantine/` and `pictures/` in that bucket, and to
  Rekognition's `DetectModerationLabels`

The browser uploads a picture into `quarantine/` with a presigned POST that only
accepts JPEG or PNG of up to 5 MB. The app then checks the file's real type,
strips its metadata with `sharp`, moderates the stripped image with Rekognition
and publishes it under `pictures/`, deleting the picture it replaces. A blocked
upload is deleted and the current picture stays. Pictures are shown through
signed links that expire after at most 15 minutes, and only signed-in students
are given one.

Cognito can't add required attributes to an existing pool, which is why the pool
is new. Accounts in the old pool aren't migrated, so students sign up again.

The app saves a student's name in their Profile the first time it sees them on
the server, and doesn't update it later. Changing the name in Cognito doesn't
change the Profile.

## Picture moderation

The app calls `DetectModerationLabels` on every upload, in the same request that
publishes it. A picture is blocked when any label has a confidence of at least
`PICTURE_MODERATION_MIN_CONFIDENCE` (default `80`) and belongs to one of the
top-level categories in `PICTURE_MODERATION_BLOCKED_CATEGORIES`, a
comma-separated list. By default these are Explicit, Non-Explicit Nudity of
Intimate parts and Kissing, Violence, Visually Disturbing, Hate Symbols, Rude
Gestures, Drugs & Tobacco, and Alcohol. "Swimwear or Underwear" and Gambling are
allowed. There is no face check and no human review.

The student sees one generic message whichever label matched. Each block is
logged with the student's ID and the names of the matching labels, never the
image, so the threshold and categories can be tuned from the logs.

To change either setting, set the GitHub variable of the same name and
redeploy. Leave a variable unset to keep its default.

## Prerequisites

Terraform 1.6+, AWS CLI v2, and authenticated AWS access. The defaults create
everything in `us-east-1`. To change the region or resource names:

```bash
cp infrastructure/profiles/terraform.tfvars.example \
   infrastructure/profiles/terraform.tfvars
```

`app_execution_role_arn` is required: set it to the value of the
`AWS_LAMBDA_EXECUTION_ROLE_ARN` secret. If the app runs on origins other than
`findmystudents.com`, `www.findmystudents.com` and `localhost:3000`, set
`app_origins` too, or uploads from them fail CORS.

## Manual steps

Run these once, in order.

### 1. Apply the Terraform

From the repository root:

```bash
terraform -chdir=infrastructure/profiles init -input=false
terraform -chdir=infrastructure/profiles plan
terraform -chdir=infrastructure/profiles apply
terraform -chdir=infrastructure/profiles output
```

The plan creates the user pool, the app client, the table with its index, the
picture bucket and its settings, and the role policy for the bucket and
Rekognition. On a table
that already exists, the plan only adds the index; DynamoDB fills it from the
existing Help Offers in the background.
The pool and the table have deletion protection turned on.

### 2. Let the app read and write the table

The Web Function's execution role, `AWS_LAMBDA_EXECUTION_ROLE_ARN`, needs
`dynamodb:Query`, `dynamodb:BatchGetItem`, `dynamodb:PutItem`,
`dynamodb:UpdateItem` and `dynamodb:DeleteItem` on the `profiles_table_arn`
output, and `dynamodb:Query` on `<profiles_table_arn>/index/course-volunteers`
for course pages. Adding and removing Help Offers runs these inside
`TransactWriteItems`, which needs no extra action.
Add these as an inline policy on that role. Later Terraform will manage this
policy. Terraform already manages the role's access to the picture bucket.

### 3. Switch the Cognito GitHub vars

In **Settings → Secrets and variables → Actions → Variables**, set:

| Variable | Terraform output |
| --- | --- |
| `NEXT_PUBLIC_COGNITO_USER_POOL_ID` | `user_pool_id` |
| `NEXT_PUBLIC_COGNITO_CLIENT_ID` | `user_pool_client_id` |
| `PROFILES_TABLE_NAME` | `profiles_table_name` |
| `PROFILE_PICTURES_BUCKET_NAME` | `profile_pictures_bucket_name` |

`PICTURE_MODERATION_MIN_CONFIDENCE` and `PICTURE_MODERATION_BLOCKED_CATEGORIES`
are optional; see [Picture moderation](#picture-moderation).

For local development, put the same values in `.env.local`. Then redeploy by
running the deploy workflow from the Actions tab, or by pushing to `main`.
`NEXT_PUBLIC_*` values are embedded at build time, so a redeploy is required.

Check that signup, confirm-signup, login, logout and `/students/<your id>` work
against the new pool, and that you can upload, replace and remove a picture.
Try a few ordinary photos, including a swimwear photo, which should be
accepted, and sample images from the blocked categories, which should be
refused while your current picture stays.

For local development, your AWS credentials need the same bucket and
Rekognition access as the app's role.

### 4. Retire the old pool

Once the new pool works in production, delete the old one. Its accounts can't
sign in to the app any more. In the Cognito console, open the old pool, turn off
deletion protection if it's on, and delete it, or run:

```bash
aws cognito-idp delete-user-pool --region us-east-1 --user-pool-id <old pool id>
```

Deleting a pool can't be undone.

## Static checks

```bash
terraform -chdir=infrastructure/profiles fmt -check
terraform -chdir=infrastructure/profiles validate
```

Keep the ignored local Terraform state files. Configure shared remote state
before deploying collaboratively. Never delete state and redeploy the same
resource names.
