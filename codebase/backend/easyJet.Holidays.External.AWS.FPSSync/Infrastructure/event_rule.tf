resource "aws_lambda_event_source_mapping" "event_source_mapping" {
  event_source_arn                   = aws_sqs_queue.flight_fare_updates.arn
  enabled                            = var.sqs_trigger_enabled
  function_name                      = aws_lambda_function.lambda_function.arn
  maximum_batching_window_in_seconds = 10
  batch_size                         = var.sqs_trigger_batch_size

  scaling_config {
    maximum_concurrency = var.sqs_max_concurrency
  }

  metrics_config {
    metrics = [
      "EventCount"
    ]
  }
}
