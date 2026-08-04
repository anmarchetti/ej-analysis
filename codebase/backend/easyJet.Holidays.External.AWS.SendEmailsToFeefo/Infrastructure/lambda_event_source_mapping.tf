resource "aws_lambda_event_source_mapping" "sqs_trigger" {
  event_source_arn                   = data.aws_sqs_queue.feefo.arn
  function_name                      = aws_lambda_function.lambda_function.arn
  enabled                            = var.trigger_enabled
  batch_size                         = var.sqs_trigger_batch_size
  maximum_batching_window_in_seconds = 10
  function_response_types = [
    "ReportBatchItemFailures"
  ]

  scaling_config {
    maximum_concurrency = var.sqs_trigger_max_concurrency
  }
}
