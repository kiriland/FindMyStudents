# Profiles infrastructure

Terraform for student Profiles:

- a new Cognito user pool. Email is the username and must be verified. First
  name (`given_name`) and last name (`family_name`) are required.
- the public web app client that Amplify uses in the browser
- the `findmystudents-profiles` DynamoDB table, with one item per Profile and
  one item per Help Offer in the student's partition
- the table's `course-volunteers` index, which lists a Course's Volunteers
  newest Help Offer first. Only Help Offer items are in it.

Cognito can't add required attributes to an existing pool, which is why the pool
is new. Accounts in the old pool aren't migrated, so students sign up again.

The app saves a student's name in their Profile the first time it sees them on
the server, and doesn't update it later. Changing the name in Cognito doesn't
change the Profile.

## Prerequisites

Terraform 1.6+, AWS CLI v2, and authenticated AWS access. The defaults create
everything in `us-east-1`. To change the region or resource names:

```bash
cp infrastructure/profiles/terraform.tfvars.example \
   infrastructure/profiles/terraform.tfvars
```

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

The plan creates the user pool, the app client and the table with its index,
and nothing else. On a table that already exists, the plan only adds the index;
DynamoDB fills it from the existing Help Offers in the background.
The pool and the table have deletion protection turned on.

### 2. Let the app read and write the table

The Web Function's execution role, `AWS_LAMBDA_EXECUTION_ROLE_ARN`, needs
`dynamodb:Query`, `dynamodb:BatchGetItem`, `dynamodb:PutItem`,
`dynamodb:UpdateItem` and `dynamodb:DeleteItem` on the `profiles_table_arn`
output, and `dynamodb:Query` on `<profiles_table_arn>/index/course-volunteers`
for course pages. Adding and removing Help Offers runs these inside
`TransactWriteItems`, which needs no extra action.
Add these as an inline policy on that role. Later Terraform will manage this
policy.

### 3. Switch the Cognito GitHub vars

In **Settings → Secrets and variables → Actions → Variables**, set:

| Variable | Terraform output |
| --- | --- |
| `NEXT_PUBLIC_COGNITO_USER_POOL_ID` | `user_pool_id` |
| `NEXT_PUBLIC_COGNITO_CLIENT_ID` | `user_pool_client_id` |
| `PROFILES_TABLE_NAME` | `profiles_table_name` |

For local development, put the same values in `.env.local`. Then redeploy by
running the deploy workflow from the Actions tab, or by pushing to `main`.
`NEXT_PUBLIC_*` values are embedded at build time, so a redeploy is required.

Check that signup, confirm-signup, login, logout and `/students/<your id>` work
against the new pool.

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
