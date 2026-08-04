resource "aws_cloudwatch_event_rule" "lambda_event_rule" {
  name                = "${local.lambda_function_name}-Trigger"
  schedule_expression = "cron(${var.cron_schedule})"
}

resource "aws_cloudwatch_event_target" "lambda_event_target" {
  rule = aws_cloudwatch_event_rule.lambda_event_rule.name
  arn  = aws_lambda_function.lambda_function.arn
}

resource "aws_lambda_permission" "lambda_permission_allow_cloudwatch" {
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda_function.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.lambda_event_rule.arn
}
