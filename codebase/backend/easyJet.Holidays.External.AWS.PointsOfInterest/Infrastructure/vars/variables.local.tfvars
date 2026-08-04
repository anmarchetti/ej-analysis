environment_name                 = "Dev"
region                           = "eu-west-1"
lambda_deployment_package_bucket = "ejh-web-dev-lambda-packages"
lambda_deployment_package_key    = "ejh-web.points-of-interest/ejh-web.points-of-interest.0.0.2-r.2e1081e.zip"
memory_size                      = "512"
timeout                          = "600"
retry_count                      = "0"
infra_alerts_topic               = "arn:aws:sns:eu-west-1:149716644794:web-dev-infra-alerts"
bedrock_client_model_id          = "anthropic.claude-haiku-4-5-20251001-v1:0"

# Environment variables
lambda_env = {
  cms_host              = "https://cd-ci.webdev.ejholidays.ejcloud.net"
  places_client_api_key = ""
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
