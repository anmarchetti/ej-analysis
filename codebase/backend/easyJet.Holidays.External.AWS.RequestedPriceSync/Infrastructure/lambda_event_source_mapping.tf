resource "aws_lambda_event_source_mapping" "sqs_trigger" {
  event_source_arn = data.aws_sqs_queue.requested_price.arn
  function_name    = aws_lambda_function.lambda_function.arn
  batch_size       = 1

  scaling_config {
    maximum_concurrency = var.sqs_trigger_max_concurrency
  }
}
