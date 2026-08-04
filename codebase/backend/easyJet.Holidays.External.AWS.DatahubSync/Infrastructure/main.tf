data "aws_caller_identity" "current" {
}

module "global_resources" {
  source = "https://artifactory.easyjet.com/artifactory/ejh-terraform-modules/nlz-global-resources/1.0.0.zip"
}

# Primary lambda function
import {
  id = "https://sqs.eu-west-1.amazonaws.com/${data.aws_caller_identity.current.account_id}/${var.atcom_booking_change_events_queue}"
  to = module.datahub_lambda.aws_sqs_queue.atcom_events
}

import {
  id = "https://sqs.eu-west-1.amazonaws.com/${data.aws_caller_identity.current.account_id}/${var.atcom_booking_change_events_queue}-dlq"
  to = module.datahub_lambda.aws_sqs_queue.atcom_events_dlq
}

moved {
  from = aws_iam_role.lambda_function_role
  to   = module.datahub_lambda.aws_iam_role.lambda_function_role
}

moved {
  from = aws_dynamodb_table.logs_table
  to   = module.datahub_lambda.aws_dynamodb_table.logs_table
}

moved {
  from = aws_iam_role_policy.lambda_function_policy
  to   = module.datahub_lambda.aws_iam_role_policy.lambda_function_policy
}

moved {
  from = aws_lambda_event_source_mapping.sqs_trigger
  to   = module.datahub_lambda.aws_lambda_event_source_mapping.sqs_trigger
}

moved {
  from = aws_lambda_function.lambda_function
  to   = module.datahub_lambda.aws_lambda_function.lambda_function
}

moved {
  from = aws_lambda_function_event_invoke_config.lambda_function_function_invoke_config
  to   = module.datahub_lambda.aws_lambda_function_event_invoke_config.lambda_function_function_invoke_config
}

module "datahub_lambda" {
  source = "./modules/datahub-sync-lambda"

  name                           = "Holidays-DatahubSync-${var.environment_name}"
  deployment_package_bucket_name = var.lambda_deployment_package_bucket
  deployment_package_bucket_key  = var.lambda_deployment_package_key
  subnet_ids                     = module.global_resources.private_subnet_ids
  security_group_id              = aws_security_group.lambda_function.id
  memory_size                    = var.memory_size
  timeout                        = var.timeout

  environment_variables = merge(
    {
      ApiSettings__UseVerboseHttpLogging   = var.lambda_env.use_verbose_http_logging
      Atcom__Booking__BaseUrl              = var.lambda_env.atcom_booking_base_url
      Atcom__Booking__Host                 = var.lambda_env.atcom_booking_host
      Atcom__DataHub__BaseUrl              = var.lambda_env.atcom_datahub_base_url
      Atcom__DataHub__Host                 = var.lambda_env.atcom_datahub_host
      Atcom__IgnoreAllErrors               = var.lambda_env.atcom_vrp_ignore_all_errors
      Atcom__UserCode                      = var.lambda_env.atcom_user_code
      CmsSettings__Host                    = var.lambda_env.cms_host
      LambdaSettings__AllowedPrefix        = var.lambda_env.allowed_prefix
      LambdaSettings__CompressionThreshold = var.lambda_env.compression_threshold
      LambdaSettings__Delay                = var.lambda_env.delay
      LambdaSettings__EnableVprCall        = var.lambda_env.enable_vrp_call
      Logging__LogLevel__Default           = var.lambda_env.log_level
    },
    {
      for idx, code in split(",", var.lambda_env.atcom_vrp_error_codes_to_ignore) :
      "Atcom__ErrorCodesToIgnore__${idx}" => code
    }
  )

  queue_name = "atcom-booking-change-events-${lower(var.environment_name)}"
  sqs_trigger_config = {
    enabled         = var.trigger_config.enabled
    batch_size      = var.trigger_config.batch_size
    max_concurrency = var.trigger_config.max_concurrency
  }
  sns_topic_arn   = aws_sns_topic.extracted_atcom_events.arn
  logs_table_name = "datahub-sync-logs-${lower(var.environment_name)}"
}

# Replay lambda function
module "datahub_replay_lambda" {
  source = "./modules/datahub-sync-lambda"

  name                           = "Holidays-DatahubReplaySync-${var.environment_name}"
  deployment_package_bucket_name = var.lambda_deployment_package_bucket
  deployment_package_bucket_key  = var.lambda_deployment_package_key
  subnet_ids                     = module.global_resources.private_subnet_ids
  security_group_id              = aws_security_group.lambda_function.id
  memory_size                    = var.memory_size
  timeout                        = var.timeout

  environment_variables = merge(
    {
      ApiSettings__UseVerboseHttpLogging   = var.replay_lambda_env.use_verbose_http_logging
      Atcom__Booking__BaseUrl              = var.lambda_env.atcom_booking_base_url
      Atcom__Booking__Host                 = var.lambda_env.atcom_booking_host
      Atcom__DataHub__BaseUrl              = var.lambda_env.atcom_datahub_base_url
      Atcom__DataHub__Host                 = var.lambda_env.atcom_datahub_host
      Atcom__IgnoreAllErrors               = var.replay_lambda_env.atcom_vrp_ignore_all_errors
      Atcom__UserCode                      = var.lambda_env.atcom_user_code
      CmsSettings__Host                    = var.lambda_env.cms_host
      LambdaSettings__AllowedPrefix        = var.lambda_env.allowed_prefix
      LambdaSettings__CompressionThreshold = var.lambda_env.compression_threshold
      LambdaSettings__Delay                = var.replay_lambda_env.delay
      LambdaSettings__EnableVprCall        = var.replay_lambda_env.enable_vrp_call
      Logging__LogLevel__Default           = var.replay_lambda_env.log_level
    },
    {
      for idx, code in split(",", var.replay_lambda_env.atcom_vrp_error_codes_to_ignore) :
      "Atcom__ErrorCodesToIgnore__${idx}" => code
    }
  )

  queue_name = "atcom-booking-change-replay-events-${lower(var.environment_name)}"
  sqs_trigger_config = {
    enabled         = var.replay_trigger_config.enabled
    batch_size      = var.replay_trigger_config.batch_size
    max_concurrency = var.replay_trigger_config.max_concurrency
  }
  sns_topic_arn   = aws_sns_topic.extracted_atcom_events.arn
  logs_table_name = "datahub-replay-sync-logs-${lower(var.environment_name)}"
}
