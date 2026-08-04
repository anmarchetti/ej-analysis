locals {
  lambda_function_name = "Holidays-FeefoDataGenerator-${var.environment_name}"
}

resource "aws_lambda_function" "lambda_function" {
  function_name                  = local.lambda_function_name
  role                           = aws_iam_role.lambda_function_role.arn
  handler                        = "FeefoDataGenerator::easyJet.Holidays.External.AWS.FeefoDataGenerator.Function_Handler_Generated::Handler"
  runtime                        = "dotnet10"
  memory_size                    = var.memory_size
  timeout                        = var.timeout
  reserved_concurrent_executions = 1

  s3_bucket         = data.aws_s3_object.lambda_function_package.bucket
  s3_key            = data.aws_s3_object.lambda_function_package.key
  s3_object_version = data.aws_s3_object.lambda_function_package.version_id

  lifecycle {
    ignore_changes = [s3_key, s3_object_version] # Don't update code automatically after creation of the function
  }

  environment {
    variables = {
      AWS_LAMBDA_HANDLER_LOG_LEVEL        = "Debug"
      ApiSettings__UseVerboseHttpLogging  = var.lambda_env.api_verbose_log_enabled
      CmsSettings__Host                   = var.lambda_env.cms_host
      EskelSettings__TimeoutMilliSeconds  = var.lambda_env.eskel_timeout
      LambdaSettings__EskelSecretName     = var.lambda_env.eskel_secret_name
      LambdaSettings__FeefoSecretName     = var.lambda_env.feefo_secret_name
      LambdaSettings__MarketingSecretName = var.lambda_env.marketing_secret_name
      LambdaSettings__QueueUrl            = aws_sqs_queue.feefo_send.url
      LambdaSettings__VerboseLog          = var.lambda_env.verbose_log_enabled
      LambdaSettings__WebsiteAgentCodes   = var.lambda_env.website_agent_codes
      MarketingSettings__UnsubscribeLink  = var.lambda_env.unsubscribe_link
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
