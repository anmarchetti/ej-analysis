environment_name                     = "#{Salesforce.EnvironmentName}"
region                               = "#{Aws.Region}"
lambda_deployment_package_bucket     = "#{Aws.S3.LambdaPackagesBucket}"
lambda_deployment_package_key        = "#{Lambda.PackageKey}"
memory_size                          = "#{Lambda.MemorySize}"
timeout                              = "#{Lambda.Timeout}"
retry_count                          = "#{Lambda.RetryCount}"
trigger_enabled                      = "#{Lambda.TriggerEnabled}"
sqs_trigger_batch_size               = "#{Lambda.SqsBatchSize}"
sqs_trigger_max_concurrency          = "#{Lambda.SqsMaxConcurrency}"
sqs_visibility_timeout_minutes       = "#{Lambda.SqsVisibilityTimeoutMinutes}"
sqs_retention_days                   = "#{Lambda.SqsRetentionDays}"
sqs_dlq_max_receive_count            = "#{Lambda.SqsDlqMaxReceiveCount}"
sqs_dlq_retention_days               = "#{Lambda.SqsDlqRetentionDays}"
operational_alerts_subscriber_emails = "#{SnsAlerts.Operational.SubscriberEmails}"
itsd_alerts_subscriber_emails        = "#{SnsAlerts.Itsd.SubscriberEmails}"

# External dependencies
extracted_atcom_events_topic_arns = "#{Lambda.Ext.ExtractedAtcomEventsTopicArns}"

# Environment variables
lambda_env = {
  aws_secrets_manager_service_url = "#{Aws.Vpce.SecretsManagerServiceUrl}"
  base_url                        = "#{Lambda.Env.BaseUrl}"
  client_id                       = "#{Lambda.Env.ClientId}"
  error_codes_to_ignore           = "#{Lambda.Env.ErrorCodesToIgnore}"
  log_level                       = "#{Lambda.Env.LogLevel}"
  login_url                       = "#{Lambda.Env.LoginUrl}"
  send_data_enabled               = "#{Lambda.Env.SendDataEnabled}"
  process_replay_messages         = "#{Lambda.Env.ProcessReplayMessages}"
  use_verbose_http_logging        = "#{Lambda.Env.UseVerboseHttpLogging}"
  username                        = "#{Lambda.Env.Username}"
}

tags = {
  application      = "#{Aws.Tag.Application}"
  cost_centre      = "#{Aws.Tag.CostCentre}"
  environment_type = "#{Aws.Tag.EnvironmentType}"
  gdpr_compliance  = "#{Aws.Tag.GdprCompliance}"
  nis_d_compliance = "#{Aws.Tag.NisdCompliance}"
  pci_compliance   = "#{Aws.Tag.PciCompliance}"
  support_team     = "#{Aws.Tag.SupportTeam}"
}
