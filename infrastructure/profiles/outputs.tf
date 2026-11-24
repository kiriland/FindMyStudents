output "user_pool_id" {
  description = "Value for the NEXT_PUBLIC_COGNITO_USER_POOL_ID GitHub variable and .env.local."
  value       = aws_cognito_user_pool.students.id
}

output "user_pool_client_id" {
  description = "Value for the NEXT_PUBLIC_COGNITO_CLIENT_ID GitHub variable and .env.local."
  value       = aws_cognito_user_pool_client.web.id
}

output "profiles_table_name" {
  description = "Value for the PROFILES_TABLE_NAME GitHub variable and .env.local."
  value       = aws_dynamodb_table.profiles.name
}

output "profiles_table_arn" {
  value = aws_dynamodb_table.profiles.arn
}

output "profile_pictures_bucket_name" {
  description = "Value for the PROFILE_PICTURES_BUCKET_NAME GitHub variable and .env.local."
  value       = aws_s3_bucket.pictures.bucket
}

output "notification_failures_queue_url" {
  description = "Connection Request events whose Notification could not be sent."
  value       = aws_sqs_queue.notification_failures.url
}
