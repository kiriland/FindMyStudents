variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "name" {
  type    = string
  default = "findmystudents-course-importer"
  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{2,39}$", var.name))
    error_message = "Use 3-40 lowercase letters, digits, and hyphens, beginning with a letter."
  }
}

variable "table_name" {
  description = "Existing on-demand course table with school and courseCode keys."
  type        = string
  default     = "classes"
}

variable "catalog_id" {
  description = "Empty discovers the current public undergraduate catalog on every invocation. Override for a specific catalog."
  type        = string
  default     = ""
}

variable "schedules_enabled" {
  type    = bool
  default = true
}

variable "semester_schedules" {
  description = "Four annual refresh dates at 06:00 New York time. Defaults are approximate; customize to the academic calendar."
  type        = map(string)
  default = {
    winter = "cron(0 6 2 1 ? *)"
    spring = "cron(0 6 25 1 ? *)"
    summer = "cron(0 6 1 6 ? *)"
    fall   = "cron(0 6 28 8 ? *)"
  }
  validation {
    condition     = length(var.semester_schedules) == 4 && alltrue([for key in ["winter", "spring", "summer", "fall"] : contains(keys(var.semester_schedules), key)])
    error_message = "Provide winter, spring, summer, and fall schedules."
  }
}
