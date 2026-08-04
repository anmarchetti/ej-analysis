environment_name                 = "Dev"
region                           = "eu-west-1"
lambda_deployment_package_bucket = "ejh-web-dev-lambda-packages"
lambda_deployment_package_key    = "lambda-placeholder-package.zip"
memory_size                      = "1024"
timeout                          = "300"
retry_count                      = "0"
infra_alerts_topic               = "arn:aws:sns:eu-west-1:149716644794:web-dev-infra-alerts"
trigger_enabled                  = "true"
sqs_trigger_batch_size           = "3"
sqs_trigger_max_concurrency      = "5"
secrets_manager_kms_key_id       = "21715801-1bad-4f46-b76e-634caee4a8e9"

# External dependencies
auth_tokens_table_name = "web-ci-auth-token-cache"
feefo_queue_name       = "feefo-sales-upload-dev"

# Environment variables
lambda_env = {
  api_verbose_log_enabled = "true"
  delay                   = "100"
  sample_rate             = "0.3"
  feefo_secret_name       = "Web/Feefo/Api"
  csat_url                = "https://customer-data-api.webdev.ejholidays.ejcloud.net/customer/market-research"
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
