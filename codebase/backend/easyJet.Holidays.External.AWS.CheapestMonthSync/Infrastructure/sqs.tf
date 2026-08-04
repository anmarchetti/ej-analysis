data "aws_sqs_queue" "cheapest_month_sync" {
  name = "web-${lower(var.environment_name)}-cheapest-month-sync.fifo"
}
