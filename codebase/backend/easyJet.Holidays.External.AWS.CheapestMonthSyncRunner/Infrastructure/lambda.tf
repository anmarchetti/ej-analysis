locals {
  lambda_function_name = "Web-${var.environment_name}-CheapestMonthSyncRunner"
}

resource "aws_lambda_function" "lambda_function" {
  function_name                  = local.lambda_function_name
  role                           = aws_iam_role.lambda_function.arn
  handler                        = "CheapestMonthSyncRunner::easyJet.Holidays.External.AWS.CheapestMonthSyncRunner.Function_Run_Generated::Run"
  runtime                        = "dotnet10"
  memory_size                    = var.memory_size
  timeout                        = var.timeout
  reserved_concurrent_executions = 1

  s3_bucket         = data.aws_s3_object.lambda_function.bucket
  s3_key            = data.aws_s3_object.lambda_function.key
  s3_object_version = data.aws_s3_object.lambda_function.version_id

  lifecycle {
    ignore_changes = [s3_key, s3_object_version] # Don't update code automatically after creation of the function
  }

  environment {
    variables = {
      AWS_LAMBDA_HANDLER_LOG_LEVEL   = "Debug"
      CmsSettings__Host              = var.lambda_env.cms_host
      LambdaSettings__SQS__ChunkSize = var.lambda_env.chunk_size
      LambdaSettings__SQS__QueueUrl  = aws_sqs_queue.cheapest_month_sync.url
      AWS__Routes__Tables__Version   = data.aws_dynamodb_table.routes_ver.name
      AWS__Routes__Tables__Dates     = data.aws_dynamodb_table.routes_date.name
      AWS__Routes__Tables__To        = data.aws_dynamodb_table.routes_to.name
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

resource "aws_lambda_function_event_invoke_config" "lambda_function" {
  function_name          = aws_lambda_function.lambda_function.function_name
  maximum_retry_attempts = var.retry_count
}

data "aws_s3_object" "lambda_function" {
  bucket = var.lambda_deployment_package_bucket
  key    = var.lambda_deployment_package_key
}
