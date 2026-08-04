locals {
  lambda_function_name = "Holidays-SendEmailsToFeefo-${var.environment_name}"
}

resource "aws_lambda_function" "lambda_function" {
  function_name                  = local.lambda_function_name
  role                           = aws_iam_role.lambda_function_role.arn
  handler                        = "easyJet.Holidays.External.AWS.SendEmailsToFeefo::easyJet.Holidays.External.AWS.SendEmailsToFeefo.Function_Run_Generated::Run"
  runtime                        = "dotnet10"
  memory_size                    = var.memory_size
  timeout                        = var.timeout
  reserved_concurrent_executions = var.sqs_trigger_max_concurrency

  s3_bucket         = data.aws_s3_object.lambda_function_package.bucket
  s3_key            = data.aws_s3_object.lambda_function_package.key
  s3_object_version = data.aws_s3_object.lambda_function_package.version_id

  lifecycle {
    ignore_changes = [s3_key, s3_object_version] # Don't update code automatically after creation of the function
  }

  environment {
    variables = {
      AWS_LAMBDA_HANDLER_LOG_LEVEL       = "Debug"
      ApiSettings__UseVerboseHttpLogging = var.lambda_env.api_verbose_log_enabled
      LambdaSettings__Delay              = var.lambda_env.delay
      LambdaSettings__SampleRate         = var.lambda_env.sample_rate
      LambdaSettings__FeefoSecretName    = var.lambda_env.feefo_secret_name
      LambdaSettings__TokensTable        = data.aws_dynamodb_table.auth_tokens.name
      Csat__CsatUrl                      = var.lambda_env.csat_url
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
