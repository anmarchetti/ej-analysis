environment_name                 = "CI"
region                           = "eu-west-1"
lambda_deployment_package_bucket = "ejh-web-dev-lambda-packages"
lambda_deployment_package_key    = "lambda-placeholder-package.zip"
memory_size                      = "512"
timeout                          = "900"
retry_count                      = "2"
infra_alerts_topic               = "arn:aws:sns:eu-west-1:149716644794:web-dev-infra-alerts"
cron_schedule                    = "0 6,18 ? * MON-FRI *"

# Environment variables
lambda_env = {
  eskel_url                        = "https://tst.eskeldev.ejholidays.ejcloud.net/api/eskel-data/board-offers"
  eskel_timeout                    = 180
  filter_discount_percentage_value = "5"
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
