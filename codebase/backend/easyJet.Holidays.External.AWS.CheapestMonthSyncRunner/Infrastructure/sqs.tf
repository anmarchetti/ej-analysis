resource "aws_sqs_queue" "cheapest_month_sync" {
  name                       = "web-${lower(var.environment_name)}-cheapest-month-sync.fifo"
  fifo_queue                 = true
  kms_master_key_id          = "alias/aws/sqs"
  visibility_timeout_seconds = 15 * 60 # 15 minutes
  message_retention_seconds  = var.sqs_message_retention_seconds
}
