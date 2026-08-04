environment_name                 = "#{Atcom.EnvironmentName}"
region                           = "#{Aws.Region}"
lambda_deployment_package_bucket = "#{Aws.S3.LambdaPackagesBucket}"
lambda_deployment_package_key    = "#{Lambda.PackageKey}"
memory_size                      = "#{Lambda.MemorySize}"
timeout                          = "#{Lambda.Timeout}"
retry_count                      = "#{Lambda.RetryCount}"

trigger_config = {
  enabled         = "#{Lambda.TriggerEnabled}"
  batch_size      = "#{Lambda.SqsBatchSize}"
  max_concurrency = "#{Lambda.SqsMaxConcurrency}"
}

replay_trigger_config = {
  enabled         = "#{ReplayLambda.TriggerEnabled}"
  batch_size      = "#{ReplayLambda.SqsBatchSize}"
  max_concurrency = "#{ReplayLambda.SqsMaxConcurrency}"
}

sns_delivery_status_logging_role          = "#{Aws.SnsDeliveryStatusLoggingRole}"
sns_topic_allowed_subscriber_arns         = "#{SnsTopic.AllowedSubscriberArns}"
operational_alerts_subscriber_emails      = "#{SnsAlerts.Operational.SubscriberEmails}"
operational_alerts_dlq_messages_threshold = "#{SnsAlerts.Operational.DlqThreshold}"
itsd_alerts_subscriber_emails             = "#{SnsAlerts.Itsd.SubscriberEmails}"
itsd_alerts_dlq_messages_threshold        = "#{SnsAlerts.Itsd.DlqThreshold}"

# Environment variables
lambda_env = {
  allowed_prefix                  = "#{Lambda.Env.AllowedPrefix}"
  atcom_booking_base_url          = "#{Lambda.Env.AtcomBookingBaseUrl}"
  atcom_booking_host              = "#{Lambda.Env.AtcomBookingHost}"
  atcom_datahub_base_url          = "#{Lambda.Env.AtcomDataHubBaseUrl}"
  atcom_datahub_host              = "#{Lambda.Env.AtcomDataHubHost}"
  atcom_user_code                 = "#{Lambda.Env.AtcomUserCode}"
  atcom_vrp_error_codes_to_ignore = "#{Lambda.Env.AtcomVrpErrorCodesToIgnore}"
  atcom_vrp_ignore_all_errors     = "#{Lambda.Env.AtcomVrpIgnoreAllErrors}"
  cms_host                        = "#{Lambda.Env.CmsHost}"
  compression_threshold           = "#{Lambda.Env.CompressionThreshold}"
  delay                           = "#{Lambda.Env.Delay}"
  enable_vrp_call                 = "#{Lambda.Env.EnableVrpCalls}"
  log_level                       = "#{Lambda.Env.LogLevel}"
  use_verbose_http_logging        = "#{Lambda.Env.UseVerboseHttpLogging}"
}

replay_lambda_env = {
  allowed_prefix                  = "#{Lambda.Env.AllowedPrefix}"
  atcom_booking_base_url          = "#{Lambda.Env.AtcomBookingBaseUrl}"
  atcom_booking_host              = "#{Lambda.Env.AtcomBookingHost}"
  atcom_datahub_base_url          = "#{Lambda.Env.AtcomDataHubBaseUrl}"
  atcom_datahub_host              = "#{Lambda.Env.AtcomDataHubHost}"
  atcom_user_code                 = "#{Lambda.Env.AtcomUserCode}"
  atcom_vrp_error_codes_to_ignore = "#{ReplayLambda.Env.AtcomVrpErrorCodesToIgnore}"
  atcom_vrp_ignore_all_errors     = "#{ReplayLambda.Env.AtcomVrpIgnoreAllErrors}"
  cms_host                        = "#{Lambda.Env.CmsHost}"
  compression_threshold           = "#{Lambda.Env.CompressionThreshold}"
  delay                           = "#{ReplayLambda.Env.Delay}"
  enable_vrp_call                 = "#{ReplayLambda.Env.EnableVrpCalls}"
  log_level                       = "#{ReplayLambda.Env.LogLevel}"
  use_verbose_http_logging        = "#{ReplayLambda.Env.UseVerboseHttpLogging}"
}

# External dependencies
atcom_booking_change_events_queue = "#{Ext.AtcomBookingChangeEventsQueue}"

tags = {
  application      = "#{Aws.Tag.Application}"
  cost_centre      = "#{Aws.Tag.CostCentre}"
  environment_type = "#{Aws.Tag.EnvironmentType}"
  gdpr_compliance  = "#{Aws.Tag.GdprCompliance}"
  nis_d_compliance = "#{Aws.Tag.NisdCompliance}"
  pci_compliance   = "#{Aws.Tag.PciCompliance}"
  support_team     = "#{Aws.Tag.SupportTeam}"
}
