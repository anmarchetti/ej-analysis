environment_name                 = "CI"
region                           = "eu-west-1"
lambda_deployment_package_bucket = "ejh-web-dev-lambda-packages"
lambda_deployment_package_key    = "lambda-placeholder-package.zip"
memory_size                      = "2048"
timeout                          = "900"
retry_count                      = "2"
cron_schedule                    = "0 7 ? * MON-FRI *"
infra_alerts_topic               = "arn:aws:sns:eu-west-1:149716644794:web-dev-infra-alerts"
input_markets                    = "UK,CH,FR,DE"

# Environment variables
lambda_env = {
  atcom_ch_base_search_url    = "/ezytstch/avcache3_g"
  atcom_de_base_search_url    = "/ezytstde/avcache3_g"
  atcom_fr_base_search_url    = "/ezytstfr/avcache3_g"
  atcom_request_timeout       = "240000"
  atcom_search_host           = "https://ezy-tst-cac.atcoretec.com"
  atcom_search_query_template = "s_tp=3&h_tp=P&tpf=Y&direct=N&names=1&fc_pp=Y&{0}&cty=1"
  atcom_uk_base_search_url    = "/ezytstuk/avcache3_g"
  cms_api_get_luggage         = "api/Luggage/Get"
  cms_host                    = "https://cd-ci.webdev.ejholidays.ejcloud.net"
  default_language            = "en"
  duplication_board_suffix    = "-"
  get_all_hotel_codes_url     = "api/ReferenceData/GetAllHotelCodes"
  log_level                   = "Debug"
  market_brands               = "{\"UK\":\"F\",\"CH\":\"S\",\"DE\":\"D\",\"FR\":\"R\"}"
  market_languages            = "{\"CH\":[\"fr-CH\",\"de-CH\"],\"UK\":[\"en\"],\"DE\":[\"de-DE\"],\"FR\":[\"fr-FR\"]}"
  market_master_language_map  = "{\"CH\":\"fr-CH\",\"UK\":\"en\",\"DE\":\"de-DE\",\"FR\":\"fr-FR\"}"
  system_priorities           = "{\"Static\":1,\"TGX\":0}"
}

# External dependencies
tourist_tax_bucket_name = "ejh-web-ci-tourist-tax"

tags = {
  application      = "easyJet Holidays Website AS"
  cost_centre      = "44000"
  environment_type = "Dev"
  gdpr_compliance  = "N"
  nis_d_compliance = "N"
  pci_compliance   = "N"
  support_team     = "Holidays.DevOps@easyjet.com"
}
