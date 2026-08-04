region                                    = "#{Aws.Region}"
environment_name                          = "#{Global.EnvironmentName}"
lambda_deployment_package_bucket          = "#{Aws.S3.LambdaPackagesBucket}"
lambda_deployment_package_key             = "#{Lambda.PackageKey}"
memory_size                               = "#{Lambda.MemorySize}"
timeout                                   = "#{Lambda.Timeout}"
retry_count                               = "#{Lambda.RetryCount}"
trigger_enabled                           = "#{Lambda.TriggerEnabled}"
infra_alerts_topic                        = "#{Aws.Sns.InfraAlertsTopicArn}"
secrets_manager_kms_key_id                = "#{Aws.Kms.SecretsManagerKeyId}"
hotel_content_bucket_name                 = "#{Aws.S3.HotelContentBucket.Name}"
hotel_content_bucket_allowed_cors_origins = "#{Aws.S3.HotelContentBucket.AllowedCorsOrigins}"

# External dependencies
salesforce_iam_user_arn = "#{Ext.SalesforceIamUserArn}"

tags = {
  application      = "#{Aws.Tag.Application}"
  cost_centre      = "#{Aws.Tag.CostCentre}"
  environment_type = "#{Aws.Tag.EnvironmentType}"
  gdpr_compliance  = "#{Aws.Tag.GdprCompliance}"
  nis_d_compliance = "#{Aws.Tag.NisdCompliance}"
  pci_compliance   = "#{Aws.Tag.PciCompliance}"
  support_team     = "#{Aws.Tag.SupportTeam}"
}
