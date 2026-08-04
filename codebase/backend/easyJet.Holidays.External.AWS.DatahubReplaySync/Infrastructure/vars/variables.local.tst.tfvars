environment_name                 = "TST"
region                           = "eu-west-1"
lambda_deployment_package_bucket = "ejh-shared-dev-lambda-packages"
lambda_deployment_package_key    = "lambda-placeholder-package.zip"
memory_size                      = "1024"
timeout                          = "900"
retry_count                      = "0"
infra_alerts_topic               = "arn:aws:sns:eu-west-1:842254000532:ejh-shared-dev-infra-alerts"

# External dependencies
atcom_booking_change_events_queue = "atcom-booking-change-replay-events-tst"

# Environment variables
lambda_env = {
  max_bookings_per_file = "20000"
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
