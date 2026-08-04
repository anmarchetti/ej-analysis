environment_name                 = "CI"
region                           = "eu-west-1"
lambda_deployment_package_bucket = "ejh-web-dev-lambda-packages"
lambda_deployment_package_key    = "lambda-placeholder-package.zip"
memory_size                      = "2048"
timeout                          = "900"
retry_count                      = "2"
infra_alerts_topic               = "arn:aws:sns:eu-west-1:149716644794:web-dev-infra-alerts"
sqs_trigger_max_concurrency      = 4

# External dependencies
requested_price_queue_name = "web-ci-requested-price-sync.fifo"

tags = {
  application      = "easyJet Holidays Website AS"
  cost_centre      = "44000"
  environment_type = "Dev"
  gdpr_compliance  = "N"
  nis_d_compliance = "N"
  pci_compliance   = "N"
  support_team     = "Holidays.DevOps@easyjet.com"
}

# External dependencies
tourist_tax_bucket_name = "ejh-web-ci-tourist-tax"

# Environment variables
lambda_env = {
  adult_holiday_code          = "adu"
  atcom_request_timeout       = "240000"
  atcom_room_systems_settings = "{\"Priorities\":{\"TGX\":0,\"Static\":1},\"SystemToDiscard\":\"HB3\"}"
  atcom_search_ch_base_url    = "/ezytstch/avcache3_g"
  atcom_search_de_base_url    = "/ezytstde/avcache3_g"
  atcom_search_fr_base_url    = "/ezytstfr/avcache3_g"
  atcom_search_host           = "https://ezy-tst-cac.atcoretec.com"
  atcom_search_uk_base_url    = "/ezytstuk/avcache3_g"
  cms_host                    = "https://cd-ci.webdev.ejholidays.ejcloud.net"
  default_language            = "en"
  duplication_board_suffix    = "-"
  log_level                   = "Debug"
  market_brands               = "{\"UK\":\"F\",\"CH\":\"S\",\"DE\":\"D\",\"FR\":\"R\"}"
  market_languages            = "{\"CH\":[\"fr-CH\",\"de-CH\"],\"UK\":[\"en\"],\"DE\":[\"de-DE\"],\"FR\":[\"fr-FR\"]}"
  market_master_language_map  = "{\"CH\":\"fr-CH\",\"UK\":\"en\",\"DE\":\"de-DE\",\"FR\":\"fr-FR\"}"
  parallelization_limit       = "2"
  search_query_template       = "s_tp=3&h_tp=P&tpf=Y&direct=N&brnd=F&names=1&fc_pp=Y&{0}&cty=1"
}
