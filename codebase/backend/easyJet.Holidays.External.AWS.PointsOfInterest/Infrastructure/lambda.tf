locals {
  lambda_function_name = "Web-${var.environment_name}-PointsOfInterest"
}

data "aws_s3_object" "lambda_function_package" {
  bucket = var.lambda_deployment_package_bucket
  key    = var.lambda_deployment_package_key
}

resource "aws_lambda_function" "lambda_function" {
  function_name = local.lambda_function_name
  role          = aws_iam_role.lambda_function_role.arn
  handler       = "PointsOfInterest::PointsOfInterest.Function_Handler_Generated::Handler"
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
      AWS_LAMBDA_HANDLER_LOG_LEVEL          = "Debug"
      SitecoreClient__BaseUrl               = var.lambda_env.cms_host
      AwsDynamoDb__PointOfInterestTableName = aws_dynamodb_table.points_of_interest.name
      AwsBedrockClient__InferenceProfileArn = data.aws_bedrock_inference_profile.bedrock_inference_profile.inference_profile_arn
      AwsBedrockClient__ModelId             = data.aws_bedrock_foundation_model.bedrock_foundation_model.model_id
      AwsPlacesClient__ApiKey               = var.lambda_env.places_client_api_key
    }
  }

  ephemeral_storage {
    size = 512
  }

  logging_config {
    log_format = "Text"
    log_group  = "/aws/lambda/web-${lower(var.environment_name)}-points-of-interest"
  }

  tracing_config {
    mode = "PassThrough"
  }

  vpc_config {
    subnet_ids         = module.global_resources.private_subnet_ids
    security_group_ids = [aws_security_group.lambda_function.id]
  }

  tags = {
    Name = local.lambda_function_name
  }
}

resource "aws_lambda_function_event_invoke_config" "lambda_function_invoke_config" {
  function_name          = aws_lambda_function.lambda_function.function_name
  maximum_retry_attempts = var.retry_count
}
