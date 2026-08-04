environment_name                 = "#{Global.EnvironmentName}"
region                           = "#{Aws.Region}"
lambda_deployment_package_bucket = "#{Aws.S3.LambdaPackagesBucket}"
lambda_deployment_package_key    = "#{Lambda.PackageKey}"
memory_size                      = "#{Lambda.MemorySize}"
timeout                          = "#{Lambda.Timeout}"
retry_count                      = "#{Lambda.RetryCount}"
infra_alerts_topic               = "#{Aws.Sns.InfraAlertsTopicArn}"
trigger_enabled                  = "#{Lambda.TriggerEnabled}"
sqs_trigger_batch_size           = "#{Lambda.SqsBatchSize}"
sqs_trigger_max_concurrency      = "#{Lambda.SqsMaxConcurrency}"
secrets_manager_kms_key_id       = "#{Aws.Kms.SecretsManagerKeyId}"

# External dependencies
auth_tokens_table_name = "#{Lambda.Ext.AuthTokensTableName}"
feefo_queue_name       = "#{Lambda.Ext.FeefoEventsQueue}"

# Environment variables
lambda_env = {
  api_verbose_log_enabled = "#{Lambda.Env.ApiVerboseLogEnabled}"
  delay                   = "#{Lambda.Env.Delay}"
  sample_rate             = "#{Lambda.Env.SampleRate}"
  feefo_secret_name       = "#{Lambda.Env.FeefoSecretName}"
  csat_url                = "#{Lambda.Env.CsatUrl}"
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
