locals {
  lambda_function_name = "Web-${var.environment_name}-RequestedPriceSyncRunner"
}

resource "aws_lambda_function" "lambda_function" {
  function_name                  = local.lambda_function_name
  role                           = aws_iam_role.lambda_function_role.arn
  handler                        = "RequestedPriceSyncRunner::easyJet.Holidays.External.AWS.RequestedPriceSyncRunner.Function_Sync_Generated::Sync"
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
      AWS_LAMBDA_HANDLER_LOG_LEVEL  = "Debug"
      CMS__Host                     = var.lambda_env.cms_host
      LambdaSettings__BatchSize     = var.lambda_env.batch_size
      LambdaSettings__Sqs__QueueUrl = aws_sqs_queue.requested_price.url
    }
  }

  vpc_config {
    subnet_ids         = module.global_resources.private_subnet_ids
    security_group_ids = [data.aws_security_group.lambda.id]
  }

  tags = {
    Name = local.lambda_function_name
  }
}

resource "aws_lambda_function_event_invoke_config" "lambda_function_invoke_config" {
  function_name          = aws_lambda_function.lambda_function.function_name
  maximum_retry_attempts = var.retry_count
}

data "aws_s3_object" "lambda_function_package" {
  bucket = var.lambda_deployment_package_bucket
  key    = var.lambda_deployment_package_key
}
