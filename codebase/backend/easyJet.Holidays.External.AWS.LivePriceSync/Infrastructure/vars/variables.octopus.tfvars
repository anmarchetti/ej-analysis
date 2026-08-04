environment_name                 = "#{Web.EnvironmentName}"
region                           = "#{Aws.Region}"
lambda_deployment_package_bucket = "#{Aws.S3.LambdaPackagesBucket}"
lambda_deployment_package_key    = "#{Lambda.PackageKey}"
memory_size                      = "#{Lambda.MemorySize}"
timeout                          = "#{Lambda.Timeout}"
retry_count                      = "#{Lambda.RetryCount}"
cron_schedule                    = "#{Lambda.CronSchedule}"
infra_alerts_topic               = "#{Aws.Sns.InfraAlertsTopicArn}"
input_markets                    = "#{Lambda.InputMarkets}"

# Environment variables
lambda_env = {
  atcom_ch_base_search_url    = "#{Lambda.Env.AtcomChSearchBaseUrl}"
  atcom_de_base_search_url    = "#{Lambda.Env.AtcomDeSearchBaseUrl}"
  atcom_fr_base_search_url    = "#{Lambda.Env.AtcomFrSearchBaseUrl}"
  atcom_request_timeout       = "#{Lambda.Env.AtcomRequestTimeout}"
  atcom_search_host           = "#{Lambda.Env.AtcomSearchHost}"
  atcom_search_query_template = "#{Lambda.Env.AtcomSearchQueryTemplate}"
  atcom_uk_base_search_url    = "#{Lambda.Env.AtcomUkSearchBaseUrl}"
  cms_api_get_luggage         = "#{Lambda.Env.CMSApiGetLuggage}"
  cms_host                    = "#{Lambda.Env.CmsHost}"
  default_language            = "#{Lambda.Env.DefaultLanguage}"
  duplication_board_suffix    = "#{Lambda.Env.DuplicationBoardSuffix}"
  get_all_hotel_codes_url     = "#{Lambda.Env.GetAllHotelCodesUrl}"
  log_level                   = "#{Lambda.Env.LogLevel}"
  market_brands               = "#{Lambda.Env.MarketBrands}"
  market_languages            = "#{Lambda.Env.MarketLanguages}"
  market_master_language_map  = "#{Lambda.Env.MarketMasterLanguageMap}"
  system_priorities           = "#{Lambda.Env.SystemPriorities}"
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

tourist_tax_bucket_name = "#{AWS.S3.TouristTaxBucketName}"
