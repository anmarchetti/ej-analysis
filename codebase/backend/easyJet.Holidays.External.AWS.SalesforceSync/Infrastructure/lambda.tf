locals {
  lambda_function_name = "Holidays-SalesforceDatahubSync-${var.environment_name}"
}

resource "aws_lambda_function" "lambda_function" {
  function_name = local.lambda_function_name
  role          = aws_iam_role.lambda_function_role.arn
  handler       = "easyJet.Holidays.External.AWS.SalesforceSync::easyJet.Holidays.External.AWS.SalesforceSync.Function_Handler_Generated::Handler"
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
    variables = {
      AWS_LAMBDA_HANDLER_LOG_LEVEL                = "Debug"
      ApiSettings__UseVerboseHttpLogging          = var.lambda_env.use_verbose_http_logging
      AwsRegion                                   = "eu-west-1"
      LambdaSettings__AwsSecretManagerServiceUrl  = var.lambda_env.aws_secrets_manager_service_url
      LambdaSettings__LogTableName                = aws_dynamodb_table.logs_table.name
      LambdaSettings__PrivateKeySecretKey         = aws_secretsmanager_secret.salesforce.name
      Logging__LogLevel__Default                  = var.lambda_env.log_level
      SalesforceConfiguration__BaseUrl            = var.lambda_env.base_url
      SalesforceConfiguration__ClientId           = var.lambda_env.client_id
      SalesforceConfiguration__ErrorCodesToIgnore = var.lambda_env.error_codes_to_ignore
      SalesforceConfiguration__LoginUrl           = var.lambda_env.login_url
      LambdaSettings__ProcessReplayMessages       = var.lambda_env.process_replay_messages
      SalesforceConfiguration__SendDataEnabled    = var.lambda_env.send_data_enabled
      SalesforceConfiguration__Username           = var.lambda_env.username
    }
  }

  vpc_config {
    subnet_ids         = module.global_resources.private_subnet_ids
    security_group_ids = [aws_security_group.lambda_function.id]
  }

  tags = {
    Name = local.lambda_function_name
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
