environment_name                 = "INT1"
region                           = "eu-west-1"
lambda_deployment_package_bucket = "ejh-web-dev-lambda-packages"
lambda_deployment_package_key    = "lambda-placeholder-package.zip"
memory_size                      = "512"
timeout                          = "60"
sqs_trigger_enabled              = "false"
sqs_trigger_batch_size           = 50
sqs_max_receive_count            = 5
sqs_max_concurrency              = 30
infra_alerts_topic               = "arn:aws:sns:eu-west-1:149716644794:web-dev-infra-alerts"

# External dependencies
event_bus_execution_role = "arn:aws:iam::842254000532:role/Holidays-EventBusRule-FlightFareChangedEvents-INT1"

# Environment variables
lambda_env = {
  currencies = "GBP,CHF,EUR"
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
