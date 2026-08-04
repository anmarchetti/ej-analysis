locals {
  operational_alerts_subscribers = var.operational_alerts_subscriber_emails != "" ? split(",", var.operational_alerts_subscriber_emails) : []
  itsd_alerts_subscribers        = var.itsd_alerts_subscriber_emails != "" ? split(",", var.itsd_alerts_subscriber_emails) : []
}

resource "aws_sns_topic" "operational_alerts" {
  name = "atcom-datahub-sync-operational-alerts-${lower(var.environment_name)}"
}

resource "aws_sns_topic_subscription" "operational_alerts" {
  for_each = toset(local.operational_alerts_subscribers)

  topic_arn = aws_sns_topic.operational_alerts.arn
  protocol  = "email"
  endpoint  = each.value
}

resource "aws_sns_topic" "itsd_alerts" {
  name = "atcom-datahub-sync-itsd-alerts-${lower(var.environment_name)}"
}

resource "aws_sns_topic_subscription" "itsd_alerts" {
  for_each = toset(local.itsd_alerts_subscribers)

  topic_arn = aws_sns_topic.itsd_alerts.arn
  protocol  = "email"
  endpoint  = each.value
}
