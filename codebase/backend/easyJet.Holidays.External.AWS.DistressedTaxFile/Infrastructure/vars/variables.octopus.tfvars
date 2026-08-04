environment_name                 = "#{Global.EnvironmentName}"
region                           = "#{Aws.Region}"
lambda_deployment_package_bucket = "#{Aws.S3.LambdaPackagesBucket}"
lambda_deployment_package_key    = "#{Lambda.PackageKey}"
memory_size                      = "#{Lambda.MemorySize}"
timeout                          = "#{Lambda.Timeout}"
retry_count                      = "#{Lambda.RetryCount}"
infra_alerts_topic               = "#{Aws.Sns.InfraAlertsTopicArn}"
input_file_path_prefix           = "#{Settings.InputFilePrefix}"
enable_fps_bucket_replication    = "#{Settings.EnableReplicationToFpsBucket}"

# External dependencies
fps_files_bucket = "#{Ext.FpsBucket}"

# Environment variables
lambda_env = {
  departure_airports_child_tax_free = "#{Lambda.Env.DepartureAirportsChildTaxFree}"
  file_size_tolerance_percentage    = "#{Lambda.Env.FileSizeTolerancePercentage}"
  phase_one_enabled                 = "#{Lambda.Env.PhaseOneEnabled}"
  s3_tax_file_object_key            = "#{Lambda.Env.S3TaxFileObjectKey}"
  upload_bucket_folders             = "#{Lambda.Env.UploadBucketFolders}"
  upload_bucket_name                = "#{Lambda.Env.UploadBucketName}"
}

tags = {
  application      = "#{Aws.Tag.Application}"
  cost_centre      = "#{Aws.Tag.CostCentre}"
  environment_type = "#{Aws.Tag.EnvironmentType}"
  gdpr_compliance  = "#{Aws.Tag.GdprCompliance}"
  nis_d_compliance = "#{Aws.Tag.NisdCompliance}"
  pci_compliance   = "#{Aws.Tag.PciCompliance}"
  support_team     = "#{Aws.Tag.SupportTeam}"
}
