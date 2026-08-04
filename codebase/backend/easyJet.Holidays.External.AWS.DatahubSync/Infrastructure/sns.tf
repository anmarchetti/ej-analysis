locals {
  sns_topic_name = "atcom-datahub-sync-change-feed-${lower(var.environment_name)}.fifo"
}

resource "aws_sns_topic" "extracted_atcom_events" {
  name                             = local.sns_topic_name
  fifo_topic                       = true
  content_based_deduplication      = true
  kms_master_key_id                = "alias/aws/sns"
  sqs_failure_feedback_role_arn    = var.sns_delivery_status_logging_role
  sqs_success_feedback_role_arn    = var.sns_delivery_status_logging_role
  sqs_success_feedback_sample_rate = 100
}

resource "aws_sns_topic_policy" "extracted_atcom_events" {
  count = var.sns_topic_allowed_subscriber_arns != "" ? 1 : 0

  arn    = aws_sns_topic.extracted_atcom_events.arn
  policy = data.aws_iam_policy_document.sns_extracted_atcom_events.json
}

data "aws_iam_policy_document" "sns_extracted_atcom_events" {
  statement {
    effect = "Allow"

    principals {
      type        = "AWS"
      identifiers = ["*"]
    }

    actions = [
      "SNS:Subscribe"
    ]

    resources = [
      aws_sns_topic.extracted_atcom_events.arn,
    ]

    condition {
      test     = "StringEquals"
      variable = "SNS:Endpoint"
      values   = split(",", var.sns_topic_allowed_subscriber_arns)
    }
  }
}
