locals {
  queue_name                        = lower("salesforce-datahub-sync-${var.environment_name}")
  queue_dead_letter_name            = lower("salesforce-datahub-sync-${var.environment_name}-dlq")
  extracted_atcom_events_topic_arns = split(",", var.extracted_atcom_events_topic_arns)
}

resource "aws_sqs_queue" "salesforce_events" {
  name                       = local.queue_name
  sqs_managed_sse_enabled    = true
  visibility_timeout_seconds = var.sqs_visibility_timeout_minutes * 60
  message_retention_seconds  = var.sqs_retention_days * 86400

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.salesforce_events_dlq.arn
    maxReceiveCount     = parseint(var.sqs_dlq_max_receive_count, 10)
  })
}

resource "aws_sqs_queue" "salesforce_events_dlq" {
  name                      = local.queue_dead_letter_name
  sqs_managed_sse_enabled   = true
  message_retention_seconds = var.sqs_dlq_retention_days * 86400
}

# Subscribe SQS queue to SNS topic, where published by lambda function BookingExtractor messages are stored
resource "aws_sns_topic_subscription" "salesforce_events" {
  for_each = toset(local.extracted_atcom_events_topic_arns)

  topic_arn = each.value
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.salesforce_events.arn
}

resource "aws_sqs_queue_policy" "salesforce_events" {
  queue_url = aws_sqs_queue.salesforce_events.id
  policy    = data.aws_iam_policy_document.salesforce_events_queue_policy.json
}

data "aws_iam_policy_document" "salesforce_events_queue_policy" {
  statement {
    principals {
      type        = "Service"
      identifiers = ["sns.amazonaws.com"]
    }

    actions = [
      "sqs:SendMessage"
    ]

    resources = [
      aws_sqs_queue.salesforce_events.arn
    ]

    condition {
      test     = "ArnEquals"
      variable = "aws:SourceArn"
      values   = local.extracted_atcom_events_topic_arns
    }
  }
}
