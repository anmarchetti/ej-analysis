environment_name                 = "#{Global.EnvironmentName}"
region                           = "#{Aws.Region}"
lambda_deployment_package_bucket = "#{Aws.S3.LambdaPackagesBucket}"
lambda_deployment_package_key    = "#{Lambda.PackageKey}"
memory_size                      = "#{Lambda.MemorySize}"
timeout                          = "#{Lambda.Timeout}"
retry_count                      = "#{Lambda.RetryCount}"
infra_alerts_topic               = "#{Aws.Sns.InfraAlertsTopicArn}"
cron_schedule                    = "#{Lambda.CronSchedule}"
sqs_visibility_timeout_minutes   = "#{Lambda.SqsVisibilityTimeoutMinutes}"
sqs_retention_days               = "#{Lambda.SqsRetentionDays}"
sqs_dlq_max_receive_count        = "#{Lambda.SqsDlqMaxReceiveCount}"
sqs_dlq_retention_days           = "#{Lambda.SqsDlqRetentionDays}"
secrets_manager_kms_key_id       = "#{Aws.Kms.SecretsManagerKeyId}"

# Environment variables
lambda_env = {
  api_verbose_log_enabled = "#{Lambda.Env.ApiVerboseLogEnabled}"
  cms_host                = "#{Lambda.Env.CmsHost}"
  eskel_secret_name       = "#{Lambda.Env.EskelSecretName}"
  eskel_timeout           = "#{Lambda.Env.EskelTimeout}"
  feefo_secret_name       = "#{Lambda.Env.FeefoSecretName}"
  marketing_secret_name   = "#{Lambda.Env.MarketingEmailEncryptionSecretName}"
  unsubscribe_link        = "#{Lambda.Env.UnsubscribeLink}"
  verbose_log_enabled     = "#{Lambda.Env.VerboseLogEnabled}"
  website_agent_codes     = "#{Lambda.Env.WebsiteAgentCodes}"
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
