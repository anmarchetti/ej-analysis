environment_name                     = "UAT"
region                               = "eu-west-1"
lambda_deployment_package_bucket     = "ejh-web-dev-lambda-packages"
lambda_deployment_package_key        = "lambda-placeholder-package.zip"
memory_size                          = "1024"
timeout                              = "900"
retry_count                          = "0"
trigger_enabled                      = "true"
sqs_trigger_batch_size               = "100"
sqs_trigger_max_concurrency          = "10"
sqs_visibility_timeout_minutes       = "20"
sqs_retention_days                   = "14"
sqs_dlq_max_receive_count            = "3"
sqs_dlq_retention_days               = "14"
operational_alerts_subscriber_emails = ""
itsd_alerts_subscriber_emails        = ""

# External dependencies
extracted_atcom_events_topic_arns = "arn:aws:sns:eu-west-1:842254000532:atcom-datahub-sync-change-feed-ppd.fifo,arn:aws:sns:eu-west-1:842254000532:atcom-datahub-sync-change-feed-uat.fifo,arn:aws:sns:eu-west-1:842254000532:atcom-datahub-sync-change-feed-tst.fifo,arn:aws:sns:eu-west-1:842254000532:atcom-datahub-sync-change-feed-tst2.fifo"

# Environment variables
lambda_env = {
  aws_secrets_manager_service_url = "https://secretsmanager.eu-west-1.amazonaws.com"
  base_url                        = "https://easyjetholidays--uat.sandbox.my.salesforce.com/services/data/v56.0/actions/custom/flow/EJH_Customer_Booking_API"
  client_id                       = "3MVG9f_NjrvdVIAzyvAp_fwYW_n.RAuZRsmMHEtBUeoiT0mGJ2dqdLD91881_hKi7YGqLcf18whR.hO6Bm3IZ"
  error_codes_to_ignore           = "666"
  log_level                       = "Debug"
  login_url                       = "https://test.salesforce.com"
  send_data_enabled               = "true"
  process_replay_messages         = false
  use_verbose_http_logging        = "true"
  username                        = "ejhintegrationuser@easyjet.com.uat"
}

tags = {
  application      = "eJH ATCOM Booking Sync AS"
  cost_centre      = "44000"
  environment_type = "Dev"
  gdpr_compliance  = "N"
  nis_d_compliance = "N"
  pci_compliance   = "N"
  support_team     = "Holidays.DevOps@easyjet.com"
}
