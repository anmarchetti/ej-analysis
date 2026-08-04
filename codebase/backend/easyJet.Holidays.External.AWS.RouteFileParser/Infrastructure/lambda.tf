locals {
  lambda_function_name = "Web-${var.environment_name}-RouteFileParser"
}

resource "aws_lambda_function" "lambda_function" {
  function_name                  = local.lambda_function_name
  role                           = aws_iam_role.lambda_function_role.arn
  handler                        = "easyJet.Holidays.External.AWS.RouteFileParser::easyJet.Holidays.External.AWS.RouteFileParser.Function_Run_Generated::Run"
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
      AWS_LAMBDA_HANDLER_LOG_LEVEL = "Debug"
      Lambda__MorningFlightTime    = var.lambda_env.morning_flight_time
      Lambda__SettingsUri          = var.lambda_env.settings_url
      Lambda__DatesTableName       = aws_dynamodb_table.routes_date.name
      Lambda__FromTableName        = aws_dynamodb_table.routes_from.name
      Lambda__ToTableName          = aws_dynamodb_table.routes_to.name
      Lambda__VersionTableName     = aws_dynamodb_table.routes_version.name
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

resource "aws_lambda_function_event_invoke_config" "lambda_function_function_invoke_config" {
  function_name          = aws_lambda_function.lambda_function.function_name
  maximum_retry_attempts = var.retry_count
}

data "aws_s3_object" "lambda_function_package" {
  bucket = var.lambda_deployment_package_bucket
  key    = var.lambda_deployment_package_key
}
