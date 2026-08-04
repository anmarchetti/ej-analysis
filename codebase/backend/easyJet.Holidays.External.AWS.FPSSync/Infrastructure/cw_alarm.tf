resource "aws_cloudwatch_metric_alarm" "lambda_errors_alarm" {
  alarm_name          = "${local.lambda_function_name}-Errors"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  threshold           = 1
  evaluation_periods  = 3
  datapoints_to_alarm = 3
  period              = 60
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  statistic           = "Sum"
  alarm_actions       = [var.infra_alerts_topic]
  dimensions = {
    FunctionName = local.lambda_function_name
  }
}
