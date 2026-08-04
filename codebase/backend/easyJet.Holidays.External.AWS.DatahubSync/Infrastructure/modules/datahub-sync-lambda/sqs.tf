resource "aws_sqs_queue" "atcom_events" {
  name                       = var.queue_name
  kms_master_key_id          = "alias/aws/sqs"
  visibility_timeout_seconds = 20 * 60   # 20 minutes
  message_retention_seconds  = 4 * 86400 # 4 days

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.atcom_events_dlq.arn
    maxReceiveCount     = 3
  })
}

resource "aws_sqs_queue" "atcom_events_dlq" {
  name                      = "${var.queue_name}-dlq"
  kms_master_key_id         = "alias/aws/sqs"
  message_retention_seconds = 14 * 86400 # 14 days
}
