locals {
  lambda_function_name = "Holidays-FpsSync-${var.environment_name}"
}

resource "aws_lambda_function" "lambda_function" {
  function_name = local.lambda_function_name
  role          = aws_iam_role.lambda_function_role.arn
  handler       = "easyJet.Holidays.External.AWS.FPSSync::easyJet.Holidays.External.AWS.FPSSync.Function_Run_Generated::Run"
  runtime       = "dotnet10"
  memory_size   = var.memory_size
  timeout       = var.timeout

  environment {
    variables = {
      AWS_LAMBDA_HANDLER_LOG_LEVEL      = "Debug"
      LambdaSettings__Currencies        = var.lambda_env.currencies
      LambdaSettings__DynamoDbTableName = aws_dynamodb_table.flight_price_storedata.id
      LambdaSettings__QueueUrl          = aws_sqs_queue.fps_updates.url
    }
  }

  lifecycle {
    ignore_changes = [s3_key, s3_object_version] # Don't update code automatically after creation of the function
  }

  s3_bucket         = data.aws_s3_object.lambda_function_package.bucket
  s3_key            = data.aws_s3_object.lambda_function_package.key
  s3_object_version = data.aws_s3_object.lambda_function_package.version_id

  vpc_config {
    subnet_ids         = module.global_resources.private_subnet_ids
    security_group_ids = [aws_security_group.lambda_function.id]
  }
}

# We disable retries on the lambda level, because trigger is SQS queue and number of attempts to process message is specified there
resource "aws_lambda_function_event_invoke_config" "lambda_function" {
  function_name          = aws_lambda_function.lambda_function.function_name
  maximum_retry_attempts = 0
}

data "aws_s3_object" "lambda_function_package" {
  bucket = var.lambda_deployment_package_bucket
  key    = var.lambda_deployment_package_key
}
