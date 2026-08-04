resource "aws_cloudwatch_metric_alarm" "lambda_errors_alarm" {
  alarm_name          = "${local.lambda_function_name}-Errors"
  actions_enabled     = true
  comparison_operator = "GreaterThanThreshold"
  threshold           = 0
  evaluation_periods  = 30
  datapoints_to_alarm = 30
  period              = 60
  treat_missing_data  = "notBreaching"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  statistic           = "Sum"
  alarm_actions = [
    aws_sns_topic.operational_alerts.arn,
    aws_sns_topic.itsd_alerts.arn,
  ]
  dimensions = {
    FunctionName = local.lambda_function_name
  }
}

resource "aws_cloudwatch_metric_alarm" "dlq_not_empty" {
  alarm_name          = "${local.lambda_function_name}-Dlq"
  alarm_description   = "Messages, which were not processed by the lambda function ${local.lambda_function_name}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 60
  statistic           = "Average"
  threshold           = 250
  alarm_actions = [
    aws_sns_topic.operational_alerts.arn,
  ]
  dimensions = {
    QueueName = local.queue_dead_letter_name
  }
}

resource "aws_cloudwatch_metric_alarm" "dlq_not_empty_itsd" {
  alarm_name          = "${local.lambda_function_name}-Dlq-ITSD"
  alarm_description   = "Messages, which were not processed by the lambda function ${local.lambda_function_name}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 60
  statistic           = "Average"
  threshold           = 300
  alarm_actions = [
    aws_sns_topic.operational_alerts.arn,
    aws_sns_topic.itsd_alerts.arn,
  ]
  dimensions = {
    QueueName = local.queue_dead_letter_name
  }
}
