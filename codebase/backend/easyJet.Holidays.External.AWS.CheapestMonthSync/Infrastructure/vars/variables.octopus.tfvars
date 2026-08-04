environment_name                 = "#{Web.EnvironmentName}"
region                           = "#{Aws.Region}"
lambda_deployment_package_bucket = "#{Aws.S3.LambdaPackagesBucket}"
lambda_deployment_package_key    = "#{Lambda.PackageKey}"
memory_size                      = "#{Lambda.MemorySize}"
timeout                          = "#{Lambda.Timeout}"
retry_count                      = "#{Lambda.RetryCount}"
infra_alerts_topic               = "#{Aws.Sns.InfraAlertsTopicArn}"
sqs_trigger_max_concurrency      = "#{Lambda.SqsMaxConcurrency}"

tags = {
  application      = "#{Aws.Tag.Application}"
  cost_centre      = "#{Aws.Tag.CostCentre}"
  environment_type = "#{Aws.Tag.EnvironmentType}"
  gdpr_compliance  = "#{Aws.Tag.GdprCompliance}"
  nis_d_compliance = "#{Aws.Tag.NisdCompliance}"
  pci_compliance   = "#{Aws.Tag.PciCompliance}"
  support_team     = "#{Aws.Tag.SupportTeam}"
}

# Environment variables
lambda_env = {
  api_timeout_milli_seconds   = "#{Lambda.Env.ApiTimeoutMilliSeconds}"
  atcom_booking_base_url      = "#{Lambda.Env.AtcomBookingBaseUrl}"
  atcom_booking_host          = "#{Lambda.Env.AtcomBookingHost}"
  atcom_search_ch_base_url    = "#{Lambda.Env.AtcomSearchChBaseUrl}"
  atcom_search_ch_host        = "#{Lambda.Env.AtcomSearchHost}"
  atcom_search_de_base_url    = "#{Lambda.Env.AtcomSearchDeBaseUrl}"
  atcom_search_de_host        = "#{Lambda.Env.AtcomSearchHost}"
  atcom_search_fr_base_url    = "#{Lambda.Env.AtcomSearchFrBaseUrl}"
  atcom_search_fr_host        = "#{Lambda.Env.AtcomSearchHost}"
  atcom_search_uk_base_url    = "#{Lambda.Env.AtcomSearchUkBaseUrl}"
  atcom_search_uk_host        = "#{Lambda.Env.AtcomSearchHost}"
  b2b_url                     = "#{B2B:Url}"
  cms_host                    = "#{Lambda.Env.CmsHost}"
  is_last_available_filter_on = "#{Lambda.Env.IsLastAvailableFilterOn}"
  log_level                   = "#{Lambda.Env.LogLevel}"
  promo_page_id               = "#{Lambda.Env.PromoPageId}"
}
