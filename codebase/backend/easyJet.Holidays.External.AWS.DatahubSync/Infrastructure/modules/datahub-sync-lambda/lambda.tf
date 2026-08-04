resource "aws_lambda_function" "lambda_function" {
  function_name = var.name
  role          = aws_iam_role.lambda_function_role.arn
  handler       = "DatahubSync::easyJet.Holidays.External.AWS.DatahubSync.Function_Handler_Generated::Handler"
  runtime       = "dotnet10"
  memory_size   = var.memory_size
  timeout       = var.timeout

  s3_bucket         = data.aws_s3_object.lambda_function_package.bucket
  s3_key            = data.aws_s3_object.lambda_function_package.key
  s3_object_version = data.aws_s3_object.lambda_function_package.version_id

  lifecycle {
    ignore_changes = [s3_key, s3_object_version] # Don't update code automatically after creation of the function
  }

  environment {
    variables = merge(
      var.environment_variables,
      {
        AWS_LAMBDA_HANDLER_LOG_LEVEL = "Debug"
        LambdaSettings__LogTableName = aws_dynamodb_table.logs_table.name
        SnsSettings__TopicArn        = var.sns_topic_arn
      }
    )
  }

  vpc_config {
    subnet_ids         = var.subnet_ids
    security_group_ids = [var.security_group_id]
  }

  tags = {
    Name = var.name
  }
}

resource "aws_lambda_function_event_invoke_config" "lambda_function_function_invoke_config" {
  function_name          = aws_lambda_function.lambda_function.function_name
  maximum_retry_attempts = 0
}

data "aws_s3_object" "lambda_function_package" {
  bucket = var.deployment_package_bucket_name
  key    = var.deployment_package_bucket_key
}
