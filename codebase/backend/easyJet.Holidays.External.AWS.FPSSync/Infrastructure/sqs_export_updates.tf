# Output queue to pass data to the FpsExport lambda
resource "aws_sqs_queue" "fps_updates" {
  name                        = lower("fps-export-updates-${var.environment_name}.fifo")
  fifo_queue                  = true
  content_based_deduplication = true
  message_retention_seconds   = 4 * 86400 # 4 days
  visibility_timeout_seconds  = 3600      # 1 hour
}
