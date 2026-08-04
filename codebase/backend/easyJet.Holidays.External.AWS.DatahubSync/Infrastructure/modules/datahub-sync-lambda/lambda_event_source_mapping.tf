resource "aws_lambda_event_source_mapping" "sqs_trigger" {
  event_source_arn                   = aws_sqs_queue.atcom_events.arn
  function_name                      = aws_lambda_function.lambda_function.arn
  enabled                            = var.sqs_trigger_config.enabled
  batch_size                         = var.sqs_trigger_config.batch_size
  maximum_batching_window_in_seconds = 10
  function_response_types = [
    "ReportBatchItemFailures"
  ]

  scaling_config {
    maximum_concurrency = var.sqs_trigger_config.max_concurrency
  }

  metrics_config {
    metrics = ["EventCount"]
  }
}
