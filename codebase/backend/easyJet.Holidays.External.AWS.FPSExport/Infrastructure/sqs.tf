data "aws_sqs_queue" "fps_updates" {
  name = var.fps_export_queue
}
