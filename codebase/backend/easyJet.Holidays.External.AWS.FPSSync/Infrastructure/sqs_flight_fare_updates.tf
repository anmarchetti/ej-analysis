# Input queue to consume messages from SNS topic in the Shared NLZ account
resource "aws_sqs_queue" "flight_fare_updates" {
  name                       = lower("fps-flight-fare-updates-${var.environment_name}")
  message_retention_seconds  = 4 * 86400 # 4 days
  visibility_timeout_seconds = 5 * 60    # 5 minutes

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.flight_fare_updates_deadletter.arn
    maxReceiveCount     = var.sqs_max_receive_count
  })
}

resource "aws_sqs_queue" "flight_fare_updates_deadletter" {
  name                      = lower("fps-flight-fare-updates-${var.environment_name}-dlq")
  message_retention_seconds = 14 * 86400 # Store failed messages for 14 days (max that SQS allows)
}

resource "aws_sqs_queue_policy" "flight_fare_updates" {
  queue_url = aws_sqs_queue.flight_fare_updates.id
  policy    = data.aws_iam_policy_document.flight_fare_updates.json
}

data "aws_iam_policy_document" "flight_fare_updates" {
  statement {
    effect    = "Allow"
    actions   = ["sqs:SendMessage"]
    resources = [aws_sqs_queue.flight_fare_updates.arn]

    principals {
      type = "AWS"
      identifiers = [
        var.event_bus_execution_role
      ]
    }
  }
}
