# Main risk for requested price sync lambda is timing out after 15 minutes.
# We have up to 2 retries in place and alarm should be triggered only if all 3 attempts to run job failed.
# That's why we evaluate alarm each 5 minutes and analyze last 10 intervals (to cover 15 min * 3 attempts = 45 min time frame).
resource "aws_cloudwatch_metric_alarm" "lambda_errors_alarm" {
  alarm_name          = "${local.lambda_function_name}-Errors"
  actions_enabled     = true
  comparison_operator = "GreaterThanThreshold"
  threshold           = 0
  evaluation_periods  = 50
  datapoints_to_alarm = 3
  period              = 60
  treat_missing_data  = "notBreaching"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  statistic           = "Sum"
  alarm_actions       = [var.infra_alerts_topic]
  dimensions = {
    FunctionName = local.lambda_function_name
  }
}
