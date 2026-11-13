output "function_name" {
  value = aws_lambda_function.importer.function_name
}

output "aws_region" {
  value = var.aws_region
}

output "lambda_console_url" {
  value = "${local.console_base}/lambda/home?region=${var.aws_region}#/functions/${aws_lambda_function.importer.function_name}?tab=testing"
}
