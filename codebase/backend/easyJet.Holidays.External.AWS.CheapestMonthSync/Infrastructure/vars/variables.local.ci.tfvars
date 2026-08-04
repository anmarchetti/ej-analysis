environment_name                 = "CI"
region                           = "eu-west-1"
lambda_deployment_package_bucket = "ejh-web-dev-lambda-packages"
lambda_deployment_package_key    = "lambda-placeholder-package.zip"
memory_size                      = "1024"
timeout                          = "900"
retry_count                      = "2"
infra_alerts_topic               = "arn:aws:sns:eu-west-1:149716644794:web-dev-infra-alerts"
sqs_trigger_max_concurrency      = 4

tags = {
  application      = "easyJet Holidays Website AS"
  cost_centre      = "44000"
  environment_type = "Dev"
  gdpr_compliance  = "N"
  nis_d_compliance = "N"
  pci_compliance   = "N"
  support_team     = "Holidays.DevOps@easyjet.com"
}

# Environment variables
lambda_env = {
  api_timeout_milli_seconds   = "100000"
  atcom_booking_base_url      = "/EZYTST/VRPWebservice/AniteGateway/AniteGateway.aspx"
  atcom_booking_host          = "https://ezy-tst-vrp.atcoretec.com"
  atcom_search_ch_base_url    = "/ezytstch/avcache3_g"
  atcom_search_ch_host        = "https://ezy-tst-cac.atcoretec.com"
  atcom_search_de_base_url    = "/ezytstde/avcache3_g"
  atcom_search_de_host        = "https://ezy-tst-cac.atcoretec.com"
  atcom_search_fr_base_url    = "/ezytstfr/avcache3_g"
  atcom_search_fr_host        = "https://ezy-tst-cac.atcoretec.com"
  atcom_search_uk_base_url    = "/ezytstuk/avcache3_g"
  atcom_search_uk_host        = "https://ezy-tst-cac.atcoretec.com"
  b2b_url                     = "https://b2b.preprod2.ejtest.com"
  cms_host                    = "https://cd-ci.webdev.ejholidays.ejcloud.net"
  is_last_available_filter_on = "true"
  log_level                   = "Debug"
  promo_page_id               = "d79291c1-4926-4d04-b4e4-a4c4d48ea23b"
}
