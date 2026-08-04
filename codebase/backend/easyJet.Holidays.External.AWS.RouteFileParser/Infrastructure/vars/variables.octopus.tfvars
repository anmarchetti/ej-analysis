environment_name                 = "#{Web.EnvironmentName}"
region                           = "#{Aws.Region}"
lambda_deployment_package_key    = "#{Lambda.PackageKey}"
memory_size                      = "#{Lambda.MemorySize}"
timeout                          = "#{Lambda.Timeout}"
retry_count                      = "#{Lambda.RetryCount}"
trigger_enabled                  = "#{Lambda.TriggerEnabled}"
infra_alerts_topic               = "#{Aws.Sns.InfraAlertsTopicArn}"
lambda_deployment_package_bucket = "#{Aws.S3.LambdaPackagesBucket}"
s3_access_logging_bucket         = "#{Aws.S3.S3AccessLogsBucket}"

# Environment variables
lambda_env = {
  morning_flight_time = "#{Lambda.Env.MorningFlightTime}"
  settings_url        = "#{Lambda.Env.SettingsUrl}"
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
