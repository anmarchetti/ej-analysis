# Bucket for input files (FPS). Input will be switched to the main distressed bucket at some point
resource "aws_lambda_permission" "allow_lambda_invocation_temp" {
  statement_id   = "AllowExecutionFromS3Bucket-Temp"
  action         = "lambda:InvokeFunction"
  function_name  = aws_lambda_function.lambda_function.arn
  principal      = "s3.amazonaws.com"
  source_arn     = data.aws_s3_bucket.fps_files.arn
  source_account = data.aws_caller_identity.current.account_id
}

resource "aws_lambda_permission" "allow_lambda_invocation" {
  statement_id   = "AllowExecutionFromS3Bucket"
  action         = "lambda:InvokeFunction"
  function_name  = aws_lambda_function.lambda_function.arn
  principal      = "s3.amazonaws.com"
  source_arn     = aws_s3_bucket.distressed_files.arn
  source_account = data.aws_caller_identity.current.account_id
}

resource "aws_s3_bucket_notification" "distressed_files" {
  bucket = aws_s3_bucket.distressed_files.id

  lambda_function {
    lambda_function_arn = aws_lambda_function.lambda_function.arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = var.input_file_path_prefix
    filter_suffix       = ".csv.zip"
  }
}
