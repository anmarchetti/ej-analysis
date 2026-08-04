environment_name                 = "INT1"
region                           = "eu-west-1"
lambda_deployment_package_bucket = "ejh-web-dev-lambda-packages"
lambda_deployment_package_key    = "lambda-placeholder-package.zip"
memory_size                      = "8192"
timeout                          = "600"
retry_count                      = "0"
trigger_enabled                  = "false"
infra_alerts_topic               = "arn:aws:sns:eu-west-1:149716644794:web-dev-infra-alerts"
daily_cron_schedule              = "30 4 * * ? *"
delta_cron_schedule              = "0/5 * * * ? *"

# External dependencies
fps_dynamo_db_table = "fps-flight-fare-changes-int1"
fps_export_queue    = "fps-export-updates-int1.fifo"

# Environment variables
lambda_env = {
  currencies                = "GBP,CHF,EUR"
  ignore_departure_airports = ""
  ignore_departure_date_to  = "2024-01-01T00:00:00"
  phase_one_enabled         = false
  availability_threshold    = 4
}

tags = {
  application      = "easyJet Holidays Website AS"
  cost_centre      = "44000"
  environment_type = "Dev"
  support_team     = "Holidays.DevOps@easyjet.com"
}
