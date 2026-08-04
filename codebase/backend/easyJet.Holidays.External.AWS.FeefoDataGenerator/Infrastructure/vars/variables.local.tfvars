environment_name                 = "Dev"
region                           = "eu-west-1"
lambda_deployment_package_bucket = "ejh-web-dev-lambda-packages"
lambda_deployment_package_key    = "lambda-placeholder-package.zip"
memory_size                      = "1024"
timeout                          = "300"
retry_count                      = "1"
infra_alerts_topic               = "arn:aws:sns:eu-west-1:149716644794:web-dev-infra-alerts"
cron_schedule                    = "0 6 * * ? *"
sqs_visibility_timeout_minutes   = "5"
sqs_retention_days               = "1"
sqs_dlq_max_receive_count        = "3"
sqs_dlq_retention_days           = "14"
secrets_manager_kms_key_id       = "21715801-1bad-4f46-b76e-634caee4a8e9"

# Environment variables
lambda_env = {
  api_verbose_log_enabled = "true"
  cms_host                = "https://cd-ci.webdev.ejholidays.ejcloud.net"
  eskel_secret_name       = "Web/EskelAPI/UAT"
  eskel_timeout           = "180000"
  feefo_secret_name       = "Web/Feefo/Api"
  marketing_secret_name   = "Web/MarketingEmailEncryption"
  unsubscribe_link        = "https://www.easyjet.com/en/holidays/marketing-research-unsubscribe?encEmail={encEmail}"
  verbose_log_enabled     = "true"
  website_agent_codes     = "WAGBP,CMCPT,CMSH,LUTON,TSN1"
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
