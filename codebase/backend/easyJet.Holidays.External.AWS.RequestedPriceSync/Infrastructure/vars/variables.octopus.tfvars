environment_name                 = "#{Web.EnvironmentName}"
region                           = "#{Aws.Region}"
lambda_deployment_package_bucket = "#{Aws.S3.LambdaPackagesBucket}"
lambda_deployment_package_key    = "#{Lambda.PackageKey}"
memory_size                      = "#{Lambda.MemorySize}"
timeout                          = "#{Lambda.Timeout}"
retry_count                      = "#{Lambda.RetryCount}"
infra_alerts_topic               = "#{Aws.Sns.InfraAlertsTopicArn}"
sqs_trigger_max_concurrency      = "#{Lambda.SqsMaxConcurrency}"

# External dependencies
requested_price_queue_name = "#{Ext.RequestedPriceQueueName}"

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
  atcom_request_timeout       = "#{Lambda.Env.AtcomRequestTimeout}"
  atcom_room_systems_settings = "#{Lambda.Env.AtcomRoomSystemsSettings}"
  atcom_search_ch_base_url    = "#{Lambda.Env.AtcomSearchChBaseUrl}"
  atcom_search_de_base_url    = "#{Lambda.Env.AtcomSearchDeBaseUrl}"
  atcom_search_fr_base_url    = "#{Lambda.Env.AtcomSearchFrBaseUrl}"
  atcom_search_host           = "#{Lambda.Env.AtcomSearchHost}"
  atcom_search_uk_base_url    = "#{Lambda.Env.AtcomSearchUkBaseUrl}"
  cms_host                    = "#{Lambda.Env.CmsHost}"
  default_language            = "#{Lambda.Env.DefaultLanguage}"
  duplication_board_suffix    = "#{Lambda.Env.DuplicationBoardSuffix}"
  log_level                   = "#{Lambda.Env.LogLevel}"
  market_brands               = "#{Lambda.Env.MarketBrands}"
  market_languages            = "#{Lambda.Env.MarketLanguages}"
  market_master_language_map  = "#{Lambda.Env.MarketMasterLanguageMap}"
  parallelization_limit       = "#{Lambda.Env.ParallelizationLimit}"
  search_query_template       = "#{Lambda.Env.SearchQueryTemplate}"
}

tourist_tax_bucket_name = "#{AWS.S3.TouristTaxBucketName}"
