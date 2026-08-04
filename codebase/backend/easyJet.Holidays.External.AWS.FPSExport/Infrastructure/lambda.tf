locals {
  lambda_function_name = "Holidays-FpsExport-${var.environment_name}"
}

resource "aws_lambda_function" "lambda_function" {
  function_name = local.lambda_function_name
  role          = aws_iam_role.lambda_function_role.arn
  handler       = "easyJet.Holidays.External.AWS.FPSExport::easyJet.Holidays.External.AWS.FPSExport.Function_Run_Generated::Run"
  runtime       = "dotnet10"
  memory_size   = var.memory_size
  timeout       = var.timeout

  environment {
    variables = {
      AWS_LAMBDA_HANDLER_LOG_LEVEL                           = "Debug"
      LambdaSettings__Currencies                             = var.lambda_env.currencies
      LambdaSettings__DynamoDbTableName                      = data.aws_dynamodb_table.fps_dynamodb.name
      LambdaSettings__IgnoreDepartureAirports                = var.lambda_env.ignore_departure_airports
      LambdaSettings__IgnoreDepartureDateTo                  = var.lambda_env.ignore_departure_date_to
      LambdaSettings__QueueUrl                               = data.aws_sqs_queue.fps_updates.url
      LambdaSettings__S3BucketName                           = aws_s3_bucket.fps_files.id
      LambdaSettings__NewFareClassPhaseOneEnabled            = var.lambda_env.phase_one_enabled
      LambdaSettings__MinimumDiscountedAvailabilityThreshold = var.lambda_env.availability_threshold
    }
  }

  s3_bucket         = data.aws_s3_object.lambda_function_package.bucket
  s3_key            = data.aws_s3_object.lambda_function_package.key
  s3_object_version = data.aws_s3_object.lambda_function_package.version_id

  lifecycle {
    ignore_changes = [s3_key, s3_object_version] # Don't update code automatically after creation of the function
  }

  vpc_config {
    subnet_ids         = module.global_resources.private_subnet_ids
    security_group_ids = [aws_security_group.lambda_function.id]
  }
}

resource "aws_lambda_function_event_invoke_config" "lambda_function_function_invoke_config" {
  function_name          = aws_lambda_function.lambda_function.function_name
  maximum_retry_attempts = var.retry_count
}

data "aws_s3_object" "lambda_function_package" {
  bucket = var.lambda_deployment_package_bucket
  key    = var.lambda_deployment_package_key
}
