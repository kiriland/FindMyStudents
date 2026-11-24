# The SES domain identity is verified outside Terraform (DKIM records live with
# the domain's DNS). Cognito sends through it with its email service-linked role.
data "aws_sesv2_email_identity" "sender" {
  email_identity = local.email_from_domain

  lifecycle {
    postcondition {
      condition     = self.verified_for_sending_status
      error_message = "The SES identity ${local.email_from_domain} is not verified for sending."
    }
  }
}

# Cognito cannot add required attributes to an existing pool, so students sign up
# into this new pool. Existing accounts in the old pool are not migrated.
resource "aws_cognito_user_pool" "students" {
  name                     = var.name
  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]
  deletion_protection      = "ACTIVE"

  username_configuration {
    case_sensitive = false
  }

  user_attribute_update_settings {
    attributes_require_verification_before_update = ["email"]
  }

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  password_policy {
    minimum_length                   = 8
    require_lowercase                = true
    require_uppercase                = true
    require_numbers                  = true
    require_symbols                  = true
    temporary_password_validity_days = 7
  }

  # Verification and recovery emails go out through SES from our own domain
  # instead of Cognito's shared sender, which is capped at 50 emails a day.
  email_configuration {
    email_sending_account = "DEVELOPER"
    source_arn            = data.aws_sesv2_email_identity.sender.arn
    from_email_address    = "${var.email_from_name} <${var.email_from_address}>"
  }

  verification_message_template {
    default_email_option = "CONFIRM_WITH_CODE"
  }

  schema {
    name                = "email"
    attribute_data_type = "String"
    required            = true
    mutable             = true
    string_attribute_constraints {
      min_length = 1
      max_length = 2048
    }
  }

  # Required at signup, so Cognito refuses a missing or empty first or last name.
  schema {
    name                = "given_name"
    attribute_data_type = "String"
    required            = true
    mutable             = true
    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  schema {
    name                = "family_name"
    attribute_data_type = "String"
    required            = true
    mutable             = true
    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }
}

# Public client used by Amplify in the browser; it has no secret.
resource "aws_cognito_user_pool_client" "web" {
  name         = "${var.name}-web"
  user_pool_id = aws_cognito_user_pool.students.id

  generate_secret               = false
  explicit_auth_flows           = ["ALLOW_USER_SRP_AUTH", "ALLOW_REFRESH_TOKEN_AUTH"]
  prevent_user_existence_errors = "ENABLED"
  enable_token_revocation       = true

  read_attributes  = ["email", "email_verified", "given_name", "family_name"]
  write_attributes = ["email", "given_name", "family_name"]
}

# One item per Profile (pk = STUDENT#<id>, sk = PROFILE) and one per Help Offer
# in the same partition (sk = OFFER#<course key>).
resource "aws_dynamodb_table" "profiles" {
  name                        = var.name
  billing_mode                = "PAY_PER_REQUEST"
  hash_key                    = "pk"
  range_key                   = "sk"
  deletion_protection_enabled = true

  attribute {
    name = "pk"
    type = "S"
  }

  attribute {
    name = "sk"
    type = "S"
  }

  attribute {
    name = "courseKey"
    type = "S"
  }

  attribute {
    name = "createdAt"
    type = "S"
  }

  # A Course's Volunteers, newest Help Offer first. Only Help Offer items carry
  # courseKey, so Profiles stay out of the index. Names and bios are read from
  # the Profile items, so a bio edit never has to touch every offer.
  global_secondary_index {
    name               = "course-volunteers"
    projection_type    = "INCLUDE"
    non_key_attributes = ["studentId"]

    key_schema {
      attribute_name = "courseKey"
      key_type       = "HASH"
    }

    key_schema {
      attribute_name = "createdAt"
      key_type       = "RANGE"
    }
  }

  point_in_time_recovery {
    enabled = true
  }

  # Read by the Notifications Lambda (notifications.tf).
  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  # Declined Connection Requests carry expiresAt, the end of their cooldown, so
  # they are deleted once it is over.
  ttl {
    attribute_name = "expiresAt"
    enabled        = true
  }
}

data "aws_caller_identity" "current" {}

locals {
  email_from_domain = split("@", var.email_from_address)[1]
  # Bucket names are global, so the account ID keeps this one unique.
  pictures_bucket_name = "${var.name}-pictures-${data.aws_caller_identity.current.account_id}"
  # A role ARN may include a path; the policy needs only the role's name.
  app_role_name = regex("[^/]+$", var.app_execution_role_arn)
}

# Profile pictures. Browsers upload into quarantine/ with a presigned POST; the
# app checks and cleans each upload, then publishes it under pictures/. Nothing
# is public: pictures are shown through short-lived signed links.
resource "aws_s3_bucket" "pictures" {
  bucket = local.pictures_bucket_name
}

resource "aws_s3_bucket_public_access_block" "pictures" {
  bucket                  = aws_s3_bucket.pictures.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "pictures" {
  bucket = aws_s3_bucket.pictures.id
  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "pictures" {
  bucket = aws_s3_bucket.pictures.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_policy" "pictures" {
  bucket = aws_s3_bucket.pictures.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "DenyInsecureTransport"
      Effect    = "Deny"
      Principal = "*"
      Action    = "s3:*"
      Resource  = [aws_s3_bucket.pictures.arn, "${aws_s3_bucket.pictures.arn}/*"]
      Condition = { Bool = { "aws:SecureTransport" = "false" } }
    }]
  })
  depends_on = [aws_s3_bucket_public_access_block.pictures]
}

# Lets the app's pages POST uploads straight to the bucket. Pictures are shown
# with plain <img> tags, which need no CORS.
resource "aws_s3_bucket_cors_configuration" "pictures" {
  bucket = aws_s3_bucket.pictures.id
  cors_rule {
    allowed_methods = ["POST"]
    allowed_origins = var.app_origins
    allowed_headers = ["*"]
    max_age_seconds = 3000
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "pictures" {
  bucket = aws_s3_bucket.pictures.id

  # Uploads the app never confirmed, or failed to delete.
  rule {
    id     = "expire-quarantine"
    status = "Enabled"
    filter {
      prefix = "quarantine/"
    }
    expiration {
      days = 1
    }
  }

  rule {
    id     = "abort-incomplete-uploads"
    status = "Enabled"
    filter {}
    abort_incomplete_multipart_upload {
      days_after_initiation = 1
    }
  }
}

# The app's Web Function reads and writes Profiles and Help Offers.
resource "aws_iam_role_policy" "app_profiles_table" {
  name = "${var.name}-table"
  role = local.app_role_name
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ProfilesAndHelpOffers"
        Effect = "Allow"
        Action = [
          "dynamodb:Query",
          "dynamodb:BatchGetItem",
          "dynamodb:ConditionCheckItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
        ]
        Resource = aws_dynamodb_table.profiles.arn
      },
      {
        # Course pages list a Course's Volunteers, newest first.
        Sid      = "CourseVolunteers"
        Effect   = "Allow"
        Action   = ["dynamodb:Query"]
        Resource = "${aws_dynamodb_table.profiles.arn}/index/course-volunteers"
      }
    ]
  })
}

# The app's Web Function signs upload forms and picture links with its own
# role, so that role needs the same access the browser is granted. It also
# moderates each upload with Rekognition before publishing it.
resource "aws_iam_role_policy" "app_pictures" {
  name = "${var.name}-pictures"
  role = local.app_role_name
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "UploadsAndPictures"
        Effect = "Allow"
        Action = ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"]
        Resource = [
          "${aws_s3_bucket.pictures.arn}/quarantine/*",
          "${aws_s3_bucket.pictures.arn}/pictures/*",
        ]
      },
      {
        # Without it, reading a missing upload fails with AccessDenied instead
        # of NoSuchKey. GetObject carries no s3:prefix, so this can't be narrowed.
        Sid      = "ReportMissingKeys"
        Effect   = "Allow"
        Action   = ["s3:ListBucket"]
        Resource = aws_s3_bucket.pictures.arn
      },
      {
        # The app sends the image bytes itself, so Rekognition needs no bucket
        # access. DetectModerationLabels has no resource-level permissions.
        Sid      = "ModeratePictures"
        Effect   = "Allow"
        Action   = ["rekognition:DetectModerationLabels"]
        Resource = "*"
      }
    ]
  })
}
