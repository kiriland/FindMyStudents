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

  email_configuration {
    email_sending_account = "COGNITO_DEFAULT"
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
}
