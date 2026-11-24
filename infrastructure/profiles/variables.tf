variable "name" {
  description = "Name of the user pool and table; the app client adds a -web suffix."
  type        = string
  default     = "findmystudents-profiles"
  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{2,39}$", var.name))
    error_message = "Use 3-40 lowercase letters, digits, and hyphens, beginning with a letter."
  }
}

variable "app_execution_role_arn" {
  description = "ARN of the Web Function's execution role (the AWS_LAMBDA_EXECUTION_ROLE_ARN secret). It gets access to the picture bucket."
  type        = string
  validation {
    condition     = can(regex("^arn:aws[a-z-]*:iam::[0-9]{12}:role/", var.app_execution_role_arn))
    error_message = "Use an IAM role ARN, like arn:aws:iam::123456789012:role/name."
  }
}

# Keep the production origins in step with `serverActions.allowedOrigins` in
# next.config.ts.
variable "app_origins" {
  description = "Origins whose pages may upload pictures straight to the bucket."
  type        = list(string)
  default     = ["https://findmystudents.com", "https://www.findmystudents.com", "http://localhost:3000"]
}

variable "email_from_address" {
  description = "Sender of Cognito's verification and recovery emails. Its domain must be a verified SES identity in us-east-1."
  type        = string
  default     = "no-reply@findmystudents.com"
  validation {
    condition     = can(regex("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$", var.email_from_address))
    error_message = "Use an email address, like no-reply@findmystudents.com."
  }
}

variable "email_from_name" {
  description = "Display name shown with email_from_address."
  type        = string
  default     = "FindMyStudents"
}

variable "app_url" {
  description = "Base URL that Notification emails link to."
  type        = string
  default     = "https://findmystudents.com"
  validation {
    condition     = can(regex("^https?://[^/]+$", var.app_url))
    error_message = "Use an origin with no path or trailing slash, like https://findmystudents.com."
  }
}
