# Notifications: the table's stream runs this Lambda for each change to a pair
# item, and it emails the student a Connection Request event is for, through
# SES. Build services/notifications before planning: the zip is made from its
# bundle.

locals {
  notifications_name = "${var.name}-notifications"
}

# Records that still fail once retries are over. The queue holds where they
# were in the stream, not the records; nothing replays it.
resource "aws_sqs_queue" "notification_failures" {
  name                      = "${local.notifications_name}-failures"
  message_retention_seconds = 1209600
  sqs_managed_sse_enabled   = true
}

resource "aws_cloudwatch_log_group" "notifications" {
  name              = "/aws/lambda/${local.notifications_name}"
  retention_in_days = 90
}

resource "aws_iam_role" "notifications" {
  name = "${local.notifications_name}-lambda"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow", Principal = { Service = "lambda.amazonaws.com" }, Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "notifications" {
  name = "send-notifications"
  role = aws_iam_role.notifications.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["dynamodb:DescribeStream", "dynamodb:GetRecords", "dynamodb:GetShardIterator"]
        Resource = aws_dynamodb_table.profiles.stream_arn
      },
      {
        Effect   = "Allow"
        Action   = ["dynamodb:ListStreams"]
        Resource = "*"
      },
      {
        # Pairs and Profiles, re-read before sending.
        Effect   = "Allow"
        Action   = ["dynamodb:GetItem", "dynamodb:BatchGetItem"]
        Resource = aws_dynamodb_table.profiles.arn
      },
      {
        # Only the "sent" markers, which keep a retry from sending twice.
        Effect   = "Allow"
        Action   = ["dynamodb:PutItem", "dynamodb:DeleteItem"]
        Resource = aws_dynamodb_table.profiles.arn
        Condition = {
          "ForAllValues:StringLike" = { "dynamodb:LeadingKeys" = ["NOTIFICATION#*"] }
          "Null"                    = { "dynamodb:LeadingKeys" = "false" }
        }
      },
      {
        Effect   = "Allow"
        Action   = ["cognito-idp:ListUsers"]
        Resource = aws_cognito_user_pool.students.arn
      },
      {
        Effect   = "Allow"
        Action   = ["ses:SendEmail"]
        Resource = data.aws_sesv2_email_identity.sender.arn
      },
      {
        Effect   = "Allow"
        Action   = ["logs:CreateLogStream", "logs:PutLogEvents"]
        Resource = "${aws_cloudwatch_log_group.notifications.arn}:*"
      },
      {
        Effect   = "Allow"
        Action   = ["sqs:SendMessage"]
        Resource = aws_sqs_queue.notification_failures.arn
      }
    ]
  })
}

data "archive_file" "notifications" {
  type        = "zip"
  source_file = "${path.module}/../../services/notifications/dist/index.mjs"
  output_path = "${path.module}/notifications.zip"
}

resource "aws_lambda_function" "notifications" {
  function_name    = local.notifications_name
  description      = "Email students about Connection Requests sent to them and answers to theirs."
  role             = aws_iam_role.notifications.arn
  runtime          = "nodejs24.x"
  architectures    = ["arm64"]
  handler          = "index.handler"
  filename         = data.archive_file.notifications.output_path
  source_code_hash = data.archive_file.notifications.output_base64sha256
  timeout          = 30
  memory_size      = 256
  environment {
    variables = {
      PROFILES_TABLE_NAME = aws_dynamodb_table.profiles.name
      USER_POOL_ID        = aws_cognito_user_pool.students.id
      FROM_ADDRESS        = "${var.email_from_name} <${var.email_from_address}>"
      APP_URL             = var.app_url
    }
  }
  depends_on = [aws_iam_role_policy.notifications, aws_cloudwatch_log_group.notifications]
}

resource "aws_lambda_event_source_mapping" "notifications" {
  function_name     = aws_lambda_function.notifications.arn
  event_source_arn  = aws_dynamodb_table.profiles.stream_arn
  starting_position = "LATEST"
  batch_size        = 10
  # Send at once, never waiting to fill a batch.
  maximum_batching_window_in_seconds = 0
  # A failing record is retried for up to 5 minutes, then goes to the queue.
  maximum_record_age_in_seconds = 300
  maximum_retry_attempts        = 10
  function_response_types       = ["ReportBatchItemFailures"]

  # Only pair items: Profiles, Help Offers and the markers never send anything.
  filter_criteria {
    filter {
      pattern = jsonencode({ dynamodb = { Keys = { pk = { S = [{ prefix = "PAIR#" }] } } } })
    }
  }

  destination_config {
    on_failure {
      destination_arn = aws_sqs_queue.notification_failures.arn
    }
  }
}
