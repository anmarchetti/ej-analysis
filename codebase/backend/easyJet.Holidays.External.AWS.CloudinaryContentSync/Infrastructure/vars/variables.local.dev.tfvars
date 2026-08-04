region                                    = "eu-west-1"
environment_name                          = "Dev"
lambda_deployment_package_bucket          = "ejh-web-dev-lambda-packages"
lambda_deployment_package_key             = "lambda-placeholder-package.zip"
memory_size                               = "256"
timeout                                   = "60"
retry_count                               = "0"
trigger_enabled                           = "true"
infra_alerts_topic                        = "arn:aws:sns:eu-west-1:149716644794:web-dev-infra-alerts"
secrets_manager_kms_key_id                = "21715801-1bad-4f46-b76e-634caee4a8e9"
hotel_content_bucket_name                 = "ejh-web-dev-hotel-content"
hotel_content_bucket_allowed_cors_origins = ""

# External dependencies
salesforce_iam_user_arn = ""

tags = {
  application      = "easyJet Holidays Website AS"
  cost_centre      = "44000"
  environment_type = "Dev"
  gdpr_compliance  = "N"
  nis_d_compliance = "N"
  pci_compliance   = "N"
  support_team     = "Holidays.DevOps@easyjet.com"
}
