variable "aws_region" {
  type    = string
  default = "us-east-1"
}

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

variable "app_origins" {
  description = "Origins whose pages may upload pictures straight to the bucket."
  type        = list(string)
  default     = ["https://findmystudents.com", "https://www.findmystudents.com", "http://localhost:3000"]
}
