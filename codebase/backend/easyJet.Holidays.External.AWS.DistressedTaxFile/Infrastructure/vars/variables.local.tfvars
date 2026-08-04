environment_name                 = "Dev"
region                           = "eu-west-1"
lambda_deployment_package_bucket = "ejh-web-dev-lambda-packages"
lambda_deployment_package_key    = "lambda-placeholder-package.zip"
memory_size                      = "4096"
timeout                          = "600"
retry_count                      = "0"
infra_alerts_topic               = "arn:aws:sns:eu-west-1:149716644794:web-dev-infra-alerts"
input_file_path_prefix           = "DISCOUNTED_SEATS/Input/"
enable_fps_bucket_replication    = "true"

# External dependencies
fps_files_bucket = "ejh-web-dev-fps-files"

# Environment variables
lambda_env = {
  departure_airports_child_tax_free = "ABZ,BFS,BHX,BRS,EDI,GLA,IOM,LPL,LGW,LTN,SEN,MAN,NCL"
  file_size_tolerance_percentage    = "10"
  s3_tax_file_object_key            = "Taxes/current_taxes_2026-04-29.csv"
  upload_bucket_folders             = "DISCOUNTED_SEATS,DISTRESSED_INVENTORY"
  upload_bucket_name                = "ejh-distressed-files-dev"
  phase_one_enabled                 = false
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
