environment_name                 = "#{Web.EnvironmentName}"
region                           = "#{Aws.Region}"
lambda_deployment_package_bucket = "#{Aws.S3.LambdaPackagesBucket}"
lambda_deployment_package_key    = "#{Lambda.PackageKey}"
memory_size                      = "#{Lambda.MemorySize}"
timeout                          = "#{Lambda.Timeout}"
retry_count                      = "#{Lambda.RetryCount}"
cron_schedule                    = "#{Lambda.CronSchedule}"
infra_alerts_topic               = "#{Aws.Sns.InfraAlertsTopicArn}"
secrets_manager_kms_key_id       = "#{Aws.Kms.SecretsManagerKeyId}"

# Environment variables
lambda_env = {
  aws_secrets_manager_service_url = "#{Aws.Vpce.SecretsManagerServiceUrl}"
  atcom_db_secret_name            = "#{Lambda.Env.AtcomDbSettingsSecretName}"
  language_map                    = "#{Lambda.Env.LanguageMap}"
  cms_host                        = "#{Lambda.Env.CmsHost}"
  fail_when_no_flight_errata      = "#{Lambda.Env.FailWhenNoFlightErrata}"
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
