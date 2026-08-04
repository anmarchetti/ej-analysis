data "aws_sqs_queue" "feefo" {
  name = var.feefo_queue_name
}
