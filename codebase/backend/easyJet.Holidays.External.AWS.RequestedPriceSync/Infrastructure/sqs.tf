data "aws_sqs_queue" "requested_price" {
  name = var.requested_price_queue_name
}
