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
