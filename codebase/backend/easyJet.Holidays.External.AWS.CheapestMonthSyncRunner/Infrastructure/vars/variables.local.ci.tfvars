environment_name                 = "CI"
region                           = "eu-west-1"
lambda_deployment_package_bucket = "ejh-web-dev-lambda-packages"
lambda_deployment_package_key    = "lambda-placeholder-package.zip"
memory_size                      = "512"
timeout                          = "900"
retry_count                      = "2"
cron_schedule                    = "0 5,11,17 ? * MON-FRI *"
infra_alerts_topic               = "arn:aws:sns:eu-west-1:149716644794:web-dev-infra-alerts"
sqs_message_retention_seconds    = 21600 # 6 hours

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
  chunk_size = "10"
  cms_host   = "https://cd-ci.webdev.ejholidays.ejcloud.net"
}
