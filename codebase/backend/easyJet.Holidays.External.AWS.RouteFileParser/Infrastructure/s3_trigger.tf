resource "aws_lambda_permission" "allow_lambda_invocation" {
  statement_id   = "AllowExecutionFromS3Bucket"
  action         = "lambda:InvokeFunction"
  function_name  = aws_lambda_function.lambda_function.arn
  principal      = "s3.amazonaws.com"
  source_arn     = aws_s3_bucket.routes_file.arn
  source_account = data.aws_caller_identity.aws_account.account_id
}

resource "aws_s3_bucket_notification" "routes_bucket_notification" {
  count = var.trigger_enabled ? 1 : 0

  bucket = aws_s3_bucket.routes_file.id

  lambda_function {
    lambda_function_arn = aws_lambda_function.lambda_function.arn
    events              = ["s3:ObjectCreated:*"]
  }

  depends_on = [
    aws_lambda_permission.allow_lambda_invocation
  ]
}
