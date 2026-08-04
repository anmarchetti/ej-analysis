# This queue is moved to the `DatahubSync` lambda module
removed {
  from = aws_sqs_queue.atcom_events

  lifecycle {
    destroy = false
  }
}

data "aws_sqs_queue" "atcom_events" {
  name = var.atcom_booking_change_events_queue
}

# This queue is moved to the `DatahubSync` lambda module
removed {
  from = aws_sqs_queue.atcom_events_dlq

  lifecycle {
    destroy = false
  }
}
