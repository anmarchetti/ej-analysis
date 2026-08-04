environment_name                 = "CI"
region                           = "eu-west-1"
lambda_deployment_package_bucket = "ejh-web-dev-lambda-packages"
lambda_deployment_package_key    = "lambda-placeholder-package.zip"
memory_size                      = "512"
timeout                          = "900"
retry_count                      = "2"
cron_schedule                    = "0 7 ? * MON-FRI *"
infra_alerts_topic               = "arn:aws:sns:eu-west-1:149716644794:web-dev-infra-alerts"
secrets_manager_kms_key_id       = "21715801-1bad-4f46-b76e-634caee4a8e9"

# Environment variables
lambda_env = {
  aws_secrets_manager_service_url = "https://secretsmanager.eu-west-1.amazonaws.com"
  atcom_db_secret_name            = "Web/Atcom/TST/Db"
  language_map                    = "EN:en;FR:fr-CH;DE:de-CH"
  cms_host                        = "https://cd-ci.webdev.ejholidays.ejcloud.net"
  fail_when_no_flight_errata      = "false"
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
