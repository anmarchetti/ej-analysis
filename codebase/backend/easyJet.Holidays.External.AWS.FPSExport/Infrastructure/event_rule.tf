# Daily trigger
resource "aws_cloudwatch_event_rule" "daily_trigger" {
  name                = "${local.lambda_function_name}-Daily-Trigger"
  schedule_expression = "cron(${var.daily_cron_schedule})"
  state               = var.trigger_enabled ? "ENABLED" : "DISABLED"
}

resource "aws_cloudwatch_event_target" "daily_trigger" {
  rule = aws_cloudwatch_event_rule.daily_trigger.name
  arn  = aws_lambda_function.lambda_function.arn

  input = jsonencode({
    RunType = "Daily"
  })
}

resource "aws_lambda_permission" "daily_trigger" {
  statement_id  = "AllowExecutionFromCloudWatchDaily"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda_function.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.daily_trigger.arn
}

# Delta trigger
resource "aws_cloudwatch_event_rule" "delta_trigger" {
  name                = "${local.lambda_function_name}-Delta-Trigger"
  schedule_expression = "cron(${var.delta_cron_schedule})"
  state               = var.trigger_enabled ? "ENABLED" : "DISABLED"
}

resource "aws_cloudwatch_event_target" "delta_trigger" {
  rule = aws_cloudwatch_event_rule.delta_trigger.name
  arn  = aws_lambda_function.lambda_function.arn

  input = jsonencode({
    RunType = "Delta"
  })
}

resource "aws_lambda_permission" "delta_trigger" {
  statement_id  = "AllowExecutionFromCloudWatchDelta"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda_function.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.delta_trigger.arn
}
