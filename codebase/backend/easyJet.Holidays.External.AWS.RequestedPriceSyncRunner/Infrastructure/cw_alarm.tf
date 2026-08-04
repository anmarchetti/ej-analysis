resource "aws_cloudwatch_metric_alarm" "lambda_errors_alarm" {
  alarm_name          = "${local.lambda_function_name}-Errors"
  actions_enabled     = true
  comparison_operator = "GreaterThanThreshold"
  threshold           = 0
  evaluation_periods  = 1
  datapoints_to_alarm = 1
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
