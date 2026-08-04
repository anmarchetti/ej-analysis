resource "aws_cloudwatch_metric_alarm" "lambda_errors_alarm" {
  alarm_name          = "${module.datahub_lambda.name}-Errors"
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
    FunctionName = module.datahub_lambda.name
  }
}

resource "aws_cloudwatch_metric_alarm" "dlq_not_empty" {
  alarm_name          = "${module.datahub_lambda.name}-Dlq"
  alarm_description   = "Messages, which were not processed by the lambda function ${module.datahub_lambda.name}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 60
  statistic           = "Average"
  threshold           = var.operational_alerts_dlq_messages_threshold
  alarm_actions = [
    aws_sns_topic.operational_alerts.arn,
  ]
  dimensions = {
    QueueName = "${var.atcom_booking_change_events_queue}-dlq"
  }
}

resource "aws_cloudwatch_metric_alarm" "dlq_not_empty_itsd" {
  alarm_name          = "${module.datahub_lambda.name}-Dlq-ITSD"
  alarm_description   = "Messages, which were not processed by the lambda function ${module.datahub_lambda.name}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 60
  statistic           = "Average"
  threshold           = var.itsd_alerts_dlq_messages_threshold
  alarm_actions = [
    aws_sns_topic.operational_alerts.arn,
    aws_sns_topic.itsd_alerts.arn,
  ]
  dimensions = {
    QueueName = "${var.atcom_booking_change_events_queue}-dlq"
  }
}

resource "aws_cloudwatch_metric_alarm" "no_messages_sent" {
  alarm_name          = "${module.datahub_lambda.name}-NoMessages"
  alarm_description   = "No messages were pushed to the Atcom booking change events queue"
  comparison_operator = "LessThanThreshold"
  threshold           = 1
  metric_name         = "NumberOfMessagesSent"
  namespace           = "AWS/SQS"
  statistic           = "Sum"
  period              = 600   # 10 minutes
  evaluation_periods  = 1 * 3 # 30 minutes
  treat_missing_data  = "breaching"
  alarm_actions = [
    aws_sns_topic.operational_alerts.arn,
  ]
  dimensions = {
    QueueName = var.atcom_booking_change_events_queue
  }
}

resource "aws_cloudwatch_metric_alarm" "no_messages_sent_itsd" {
  alarm_name          = "${module.datahub_lambda.name}-NoMessages-ITSD"
  alarm_description   = "No messages were pushed to the Atcom booking change events queue - ITSD"
  comparison_operator = "LessThanThreshold"
  threshold           = 1
  metric_name         = "NumberOfMessagesSent"
  namespace           = "AWS/SQS"
  statistic           = "Sum"
  period              = 600   # 10 minutes
  evaluation_periods  = 3 * 6 # 3 hours
  treat_missing_data  = "breaching"
  alarm_actions = [
    aws_sns_topic.operational_alerts.arn,
    aws_sns_topic.itsd_alerts.arn,
  ]
  dimensions = {
    QueueName = var.atcom_booking_change_events_queue
  }
}
