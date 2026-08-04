resource "aws_sqs_queue" "requested_price" {
  name                       = "web-${lower(var.environment_name)}-requested-price-sync.fifo"
  fifo_queue                 = true
  kms_master_key_id          = "alias/aws/sqs"
  visibility_timeout_seconds = 15 * 60  # 15 minutes
  message_retention_seconds  = 1 * 3600 # 1 hour
}
