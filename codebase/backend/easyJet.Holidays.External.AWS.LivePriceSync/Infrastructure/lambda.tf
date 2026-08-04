locals {
  lambda_function_name = "Web-${var.environment_name}-LivePriceSync"
}

resource "aws_lambda_function" "lambda_function" {
  function_name                  = local.lambda_function_name
  role                           = aws_iam_role.lambda_function_role.arn
  handler                        = "easyJet.Holidays.External.AWS.LivePriceSync::easyJet.Holidays.External.AWS.LivePriceSync.Function_Sync_Generated::Sync"
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
      AWS_LAMBDA_HANDLER_LOG_LEVEL           = "Debug"
      AWS__S3__Buckets__TouristTaxRules      = data.aws_s3_bucket.tourist_tax.bucket
      Atcom__DuplicationBoardSuffix          = var.lambda_env.duplication_board_suffix
      Atcom__EndpointTemplate__Search        = var.lambda_env.atcom_search_query_template
      Atcom__MarketBrands                    = var.lambda_env.market_brands
      Atcom__RoomSystemsSettings__Priorities = var.lambda_env.system_priorities
      Atcom__Search__Ch__BaseUrl             = var.lambda_env.atcom_ch_base_search_url
      Atcom__Search__Ch__Host                = var.lambda_env.atcom_search_host
      Atcom__Search__De__BaseUrl             = var.lambda_env.atcom_de_base_search_url
      Atcom__Search__De__Host                = var.lambda_env.atcom_search_host
      Atcom__Search__Fr__BaseUrl             = var.lambda_env.atcom_fr_base_search_url
      Atcom__Search__Fr__Host                = var.lambda_env.atcom_search_host
      Atcom__Search__Uk__BaseUrl             = var.lambda_env.atcom_uk_base_search_url
      Atcom__Search__Uk__Host                = var.lambda_env.atcom_search_host
      Atcom__TimeoutMilliSeconds             = var.lambda_env.atcom_request_timeout
      Cms__Api__GetLuggage                   = var.lambda_env.cms_api_get_luggage
      Cms__Api__GetAllHotelCodes             = var.lambda_env.get_all_hotel_codes_url
      Cms__Host                              = var.lambda_env.cms_host
      Lambda__Table__TableName               = aws_dynamodb_table.live_price_table.name
      Language__DefaultLanguage              = var.lambda_env.default_language
      Language__MarketLanguages              = var.lambda_env.market_languages
      Language__MarketMasterLanguageMap      = var.lambda_env.market_master_language_map
      Logging__LogLevel__Default             = var.lambda_env.log_level
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
