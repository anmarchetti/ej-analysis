environment_name                      = "CI"
region                                = "eu-west-1"
lambda_deployment_package_bucket      = "ejh-web-dev-lambda-packages"
lambda_deployment_package_key         = "lambda-placeholder-package.zip"
memory_size                           = "256"
timeout                               = "30"
retry_count                           = "0"
infra_alerts_topic                    = "arn:aws:sns:eu-west-1:149716644794:web-dev-infra-alerts"
dynamo_db_deletion_protection_enabled = "false"

# Environment variables
lambda_env = {
  regions_file_path = "locations.csv"
  weather_file_path = "monthly_averages.csv"
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

