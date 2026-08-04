locals {
  market_triggers = toset(split(",", var.input_markets))
}

resource "aws_cloudwatch_event_rule" "schedule_trigger_event_rule" {
  for_each = local.market_triggers

  name                = "${local.lambda_function_name}-Trigger-${each.value}"
  schedule_expression = "cron(${var.cron_schedule})"
}

resource "aws_cloudwatch_event_target" "schedule_trigger_event_target" {
  for_each = local.market_triggers

  rule = aws_cloudwatch_event_rule.schedule_trigger_event_rule[each.key].name
  arn  = aws_lambda_function.lambda_function.arn

  input = jsonencode({
    Market = each.value
  })
}

resource "aws_lambda_permission" "schedule_trigger_cloudwatch_permission" {
  for_each = local.market_triggers

  statement_id  = "AllowExecutionFromCloudWatch${each.value}"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda_function.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.schedule_trigger_event_rule[each.key].arn
}
