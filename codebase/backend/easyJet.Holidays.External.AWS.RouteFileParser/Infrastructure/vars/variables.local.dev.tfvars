environment_name                 = "CI"
region                           = "eu-west-1"
lambda_deployment_package_key    = "lambda-placeholder-package.zip"
memory_size                      = "512"
timeout                          = "60"
retry_count                      = "0"
trigger_enabled                  = "true"
infra_alerts_topic               = "arn:aws:sns:eu-west-1:149716644794:web-dev-infra-alerts"
lambda_deployment_package_bucket = "ejh-web-dev-lambda-packages"
s3_access_logging_bucket         = "ejh-web-dev-s3-access-logs"

# Environment variables
lambda_env = {
  morning_flight_time = "500"
  settings_url        = "https://cd-ci.webdev.ejholidays.ejcloud.net/api/SiteSettings/GetAllMarketSettings"
}

tags = {
  application      = "easyJet Holidays Website AS"
  cost_centre      = "44000"
  environment_type = "Dev"
  gdpr_compliance  = "N"
  nis_d_compliance = "N"
  pci_compliance   = "N"
  support_team     = "Holidays.DevOps@easyjet.com"
}
