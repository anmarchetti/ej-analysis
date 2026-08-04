locals {
  lambda_function_name = "Web-${var.environment_name}-CheapestMonthSync"
}

resource "aws_lambda_function" "lambda_function" {
  function_name                  = local.lambda_function_name
  role                           = aws_iam_role.lambda_function.arn
  handler                        = "CheapestMonthSync::easyJet.Holidays.External.AWS.CheapestMonthSync.Function_Run_Generated::Run"
  runtime                        = "dotnet10"
  memory_size                    = var.memory_size
  timeout                        = var.timeout
  reserved_concurrent_executions = var.sqs_trigger_max_concurrency

  s3_bucket         = data.aws_s3_object.lambda_function.bucket
  s3_key            = data.aws_s3_object.lambda_function.key
  s3_object_version = data.aws_s3_object.lambda_function.version_id

  lifecycle {
    ignore_changes = [s3_key, s3_object_version] # Don't update code automatically after creation of the function
  }

  environment {
    variables = {
      AWS_LAMBDA_HANDLER_LOG_LEVEL            = "Debug"
      AWS__Routes__Tables__Dates              = data.aws_dynamodb_table.routes_date.name
      AWS__Routes__Tables__Version            = data.aws_dynamodb_table.routes_ver.name
      AWS__Storage__Tables__CheapestMonth     = aws_dynamodb_table.cheapest_month_sync.name
      Atcom__Booking__BaseUrl                 = var.lambda_env.atcom_booking_base_url
      Atcom__Booking__Host                    = var.lambda_env.atcom_booking_host
      Atcom__Search__Ch__BaseUrl              = var.lambda_env.atcom_search_ch_base_url
      Atcom__Search__Ch__Host                 = var.lambda_env.atcom_search_ch_host
      Atcom__Search__De__BaseUrl              = var.lambda_env.atcom_search_de_base_url
      Atcom__Search__De__Host                 = var.lambda_env.atcom_search_de_host
      Atcom__Search__Fr__BaseUrl              = var.lambda_env.atcom_search_fr_base_url
      Atcom__Search__Fr__Host                 = var.lambda_env.atcom_search_fr_host
      Atcom__Search__Uk__BaseUrl              = var.lambda_env.atcom_search_uk_base_url
      Atcom__Search__Uk__Host                 = var.lambda_env.atcom_search_uk_host
      B2B__Url                                = var.lambda_env.b2b_url
      CmsSettings__Api__TimeoutMilliSeconds   = var.lambda_env.api_timeout_milli_seconds
      CmsSettings__Host                       = var.lambda_env.cms_host
      LambdaSettings__IsLastAvailableFilterOn = var.lambda_env.is_last_available_filter_on
      LambdaSettings__PromoPageId             = var.lambda_env.promo_page_id
      Logging__LogLevel__Default              = var.lambda_env.log_level
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
