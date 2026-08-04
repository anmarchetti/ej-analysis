resource "aws_cloudwatch_event_rule" "schedule_trigger" {
  name                = "${local.lambda_function_name}-Trigger"
  schedule_expression = "cron(${var.cron_schedule})"
}

resource "aws_cloudwatch_event_target" "schedule_trigger" {
  rule = aws_cloudwatch_event_rule.schedule_trigger.name
  arn  = aws_lambda_function.lambda_function.arn
}

resource "aws_lambda_permission" "schedule_trigger_cloudwatch_permission" {
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda_function.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.schedule_trigger.arn
}
