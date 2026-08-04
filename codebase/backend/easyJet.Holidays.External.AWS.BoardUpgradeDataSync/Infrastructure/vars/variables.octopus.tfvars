environment_name                 = "#{Web.EnvironmentName}"
region                           = "#{Aws.Region}"
lambda_deployment_package_bucket = "#{Aws.S3.LambdaPackagesBucket}"
lambda_deployment_package_key    = "#{Lambda.PackageKey}"
memory_size                      = "#{Lambda.MemorySize}"
timeout                          = "#{Lambda.Timeout}"
retry_count                      = "#{Lambda.RetryCount}"
infra_alerts_topic               = "#{Aws.Sns.InfraAlertsTopicArn}"
cron_schedule                    = "#{Lambda.CronSchedule}"

# Environment variables
lambda_env = {
  eskel_url                        = "#{Lambda.Env.EskelUrl}"
  eskel_timeout                    = "#{Lambda.Env.EskelTimeoutInSeconds}"
  filter_discount_percentage_value = "#{Lambda.Env.FilterDiscountPercentageValue}"
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
