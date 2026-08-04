environment_name                 = "TST"
region                           = "eu-west-1"
lambda_deployment_package_bucket = "ejh-shared-dev-lambda-packages"
lambda_deployment_package_key    = "lambda-placeholder-package.zip"
memory_size                      = "1024"
timeout                          = "900"
retry_count                      = "0"

trigger_config = {
  enabled         = "true"
  batch_size      = "20"
  max_concurrency = "20"
}

replay_trigger_config = {
  enabled         = "true"
  batch_size      = "20"
  max_concurrency = "30"
}

sns_delivery_status_logging_role          = "arn:aws:iam::842254000532:role/HolidaysSnsDeliveryStatusLoggingRole"
sns_topic_allowed_subscriber_arns         = "arn:aws:sqs:eu-west-1:149716644794:salesforce-datahub-sync-staging,arn:aws:sqs:eu-west-1:149716644794:salesforce-datahub-sync-uat,arn:aws:sqs:eu-west-1:905418262371:delta-atcom-datahub-events-dev.fifo,arn:aws:sqs:eu-west-1:024848444257:delta-atcom-datahub-events-uat.fifo,arn:aws:sqs:eu-west-1:954976290990:delta-atcom-datahub-events-test.fifo,arn:aws:sqs:eu-west-1:943560362491:ingestion-booking-extractor-decode-dev.fifo,arn:aws:sqs:eu-west-1:943560362491:ingestion-booking-extractor-decode-replay-dev.fifo"
operational_alerts_subscriber_emails      = ""
operational_alerts_dlq_messages_threshold = "800"
itsd_alerts_subscriber_emails             = ""
itsd_alerts_dlq_messages_threshold        = "1000"

# Environment variables
lambda_env = {
  allowed_prefix                  = "7"
  atcom_booking_base_url          = "/EZYTST/VRPWebservice/AniteGateway/AniteGateway.aspx"
  atcom_booking_host              = "https://ezy-tst-vrp.atcoretec.com"
  atcom_datahub_base_url          = "/EZYTST/anitetravelwsv3/datahub.asmx"
  atcom_datahub_host              = "https://ezy-tst-vrp.atcoretec.com"
  atcom_user_code                 = "DHUNMK"
  atcom_vrp_error_codes_to_ignore = "E0755,E0932,E0534,E14543,E0999,E14772"
  atcom_vrp_ignore_all_errors     = "false"
  cms_host                        = "https://cd-ci.webdev.ejholidays.ejcloud.net"
  compression_threshold           = "60000"
  delay                           = 100
  enable_vrp_call                 = "true"
  log_level                       = "Debug"
  use_verbose_http_logging        = "true"
}

replay_lambda_env = {
  allowed_prefix                  = "7"
  atcom_booking_base_url          = "/EZYTST/VRPWebservice/AniteGateway/AniteGateway.aspx"
  atcom_booking_host              = "https://ezy-tst-vrp.atcoretec.com"
  atcom_datahub_base_url          = "/EZYTST/anitetravelwsv3/datahub.asmx"
  atcom_datahub_host              = "https://ezy-tst-vrp.atcoretec.com"
  atcom_user_code                 = "DHUNMK"
  atcom_vrp_error_codes_to_ignore = "E0755,E0932,E0534,E14543,E0999,E14772"
  atcom_vrp_ignore_all_errors     = "false"
  cms_host                        = "https://cd-ci.webdev.ejholidays.ejcloud.net"
  compression_threshold           = "60000"
  delay                           = 100
  enable_vrp_call                 = "true"
  log_level                       = "Debug"
  use_verbose_http_logging        = "true"
}

# External dependencies
atcom_booking_change_events_queue = "atcom-booking-change-events-tst"

tags = {
  application      = "eJH ATCOM Booking Sync AS"
  cost_centre      = "44000"
  environment_type = "Dev"
  gdpr_compliance  = "N"
  nis_d_compliance = "N"
  pci_compliance   = "N"
  support_team     = "Holidays.DevOps@easyjet.com"
}
