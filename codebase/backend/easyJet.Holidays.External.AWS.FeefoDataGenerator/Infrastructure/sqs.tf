resource "aws_sqs_queue" "feefo_send" {
  name                       = "feefo-sales-upload-${lower(var.environment_name)}"
  sqs_managed_sse_enabled    = true
  visibility_timeout_seconds = var.sqs_visibility_timeout_minutes * 60
  message_retention_seconds  = var.sqs_retention_days * 86400

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.feefo_send_dlq.arn
    maxReceiveCount     = parseint(var.sqs_dlq_max_receive_count, 10)
  })
}

resource "aws_sqs_queue" "feefo_send_dlq" {
  name                      = "feefo-sales-upload-${lower(var.environment_name)}-dlq"
  sqs_managed_sse_enabled   = true
  message_retention_seconds = var.sqs_dlq_retention_days * 86400
}