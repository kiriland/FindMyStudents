data "aws_caller_identity" "current" {}

data "aws_dynamodb_table" "existing" {
  name = var.table_name
  lifecycle {
    postcondition {
      condition     = self.hash_key == "school" && self.range_key == "courseCode"
      error_message = "The existing table must have school as partition key and courseCode as sort key."
    }
    postcondition {
      condition     = self.billing_mode == "PAY_PER_REQUEST"
      error_message = "The existing course table must use on-demand capacity (PAY_PER_REQUEST) for bulk imports. Switch its billing mode before deployment; see the importer README."
    }
  }
}

locals {
  table_arn    = data.aws_dynamodb_table.existing.arn
  console_base = "https://${var.aws_region}.console.aws.amazon.com"
}

resource "aws_sqs_queue" "failures" {
  name                      = "${var.name}-failures"
  message_retention_seconds = 1209600
  sqs_managed_sse_enabled   = true
}

resource "aws_cloudwatch_log_group" "importer" {
  name              = "/aws/lambda/${var.name}"
  retention_in_days = 90
}

resource "aws_iam_role" "importer" {
  name = "${var.name}-lambda"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow", Principal = { Service = "lambda.amazonaws.com" }, Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "importer" {
  name = "import-courses"
  role = aws_iam_role.importer.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["dynamodb:DescribeTable"]
        Resource = local.table_arn
      },
      {
        Effect   = "Allow"
        Action   = ["dynamodb:Query", "dynamodb:UpdateItem"]
        Resource = local.table_arn
        Condition = {
          "ForAllValues:StringEquals" = { "dynamodb:LeadingKeys" = ["Baruch College"] }
          "Null"                      = { "dynamodb:LeadingKeys" = "false" }
        }
      },
      {
        Effect   = "Allow"
        Action   = ["dynamodb:GetItem", "dynamodb:UpdateItem", "dynamodb:DeleteItem"]
        Resource = local.table_arn
        Condition = {
          "ForAllValues:StringEquals" = { "dynamodb:LeadingKeys" = ["__course_importer__"] }
          "Null"                      = { "dynamodb:LeadingKeys" = "false" }
        }
      },
      {
        Effect   = "Allow"
        Action   = ["logs:CreateLogStream", "logs:PutLogEvents"]
        Resource = "${aws_cloudwatch_log_group.importer.arn}:*"
      },
      {
        Effect   = "Allow"
        Action   = ["sqs:SendMessage"]
        Resource = aws_sqs_queue.failures.arn
      }
    ]
  })
}

data "archive_file" "importer" {
  type        = "zip"
  source_file = "${path.module}/../../services/course-importer/dist/index.mjs"
  output_path = "${path.module}/importer.zip"
}

resource "aws_lambda_function" "importer" {
  function_name    = var.name
  description      = "Sync Baruch undergraduate catalog into DynamoDB, one record per course code."
  role             = aws_iam_role.importer.arn
  runtime          = "nodejs24.x"
  architectures    = ["arm64"]
  handler          = "index.handler"
  filename         = data.archive_file.importer.output_path
  source_code_hash = data.archive_file.importer.output_base64sha256
  timeout          = 900
  memory_size      = 512
  # Use the account's shared pool, including accounts unable to reserve capacity.
  # The importer serializes real runs using a conditional DynamoDB lease instead.
  reserved_concurrent_executions = -1
  environment {
    variables = {
      DYNAMODB_TABLE_NAME = var.table_name
      CATALOG_ID          = var.catalog_id
    }
  }
  depends_on = [aws_iam_role_policy.importer]
}

resource "aws_lambda_function_event_invoke_config" "importer" {
  function_name                = aws_lambda_function.importer.function_name
  maximum_event_age_in_seconds = 21600
  maximum_retry_attempts       = 2
  destination_config {
    on_failure {
      destination = aws_sqs_queue.failures.arn
    }
  }
}

resource "aws_scheduler_schedule_group" "importer" {
  name = var.name
}

resource "aws_iam_role" "scheduler" {
  name = "${var.name}-scheduler"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow", Principal = { Service = "scheduler.amazonaws.com" }, Action = "sts:AssumeRole"
      Condition = {
        StringEquals = {
          "aws:SourceAccount" = data.aws_caller_identity.current.account_id
          "aws:SourceArn"     = aws_scheduler_schedule_group.importer.arn
        }
      }
    }]
  })
}

resource "aws_iam_role_policy" "scheduler" {
  name = "invoke-course-importer"
  role = aws_iam_role.scheduler.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      { Effect = "Allow", Action = "lambda:InvokeFunction", Resource = aws_lambda_function.importer.arn },
      { Effect = "Allow", Action = "sqs:SendMessage", Resource = aws_sqs_queue.failures.arn }
    ]
  })
}

resource "aws_scheduler_schedule" "semester" {
  for_each                     = var.semester_schedules
  name                         = "${var.name}-${each.key}"
  group_name                   = aws_scheduler_schedule_group.importer.name
  description                  = "${title(each.key)} undergraduate course catalog refresh"
  schedule_expression          = each.value
  schedule_expression_timezone = "America/New_York"
  state                        = var.schedules_enabled ? "ENABLED" : "DISABLED"
  flexible_time_window {
    mode = "OFF"
  }
  target {
    arn      = aws_lambda_function.importer.arn
    role_arn = aws_iam_role.scheduler.arn
    input = jsonencode({
      semester = each.key, scheduledTime = "<aws.scheduler.scheduled-time>"
    })
    retry_policy {
      maximum_event_age_in_seconds = 3600
      maximum_retry_attempts       = 2
    }
    dead_letter_config {
      arn = aws_sqs_queue.failures.arn
    }
  }
  depends_on = [aws_iam_role_policy.scheduler, aws_lambda_function_event_invoke_config.importer]
}
