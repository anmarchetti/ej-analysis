environment_name                 = "#{FPS.EnvironmentName}"
region                           = "#{Aws.Region}"
lambda_deployment_package_bucket = "#{Aws.S3.LambdaPackagesBucket}"
lambda_deployment_package_key    = "#{Lambda.PackageKey}"
memory_size                      = "#{Lambda.MemorySize}"
timeout                          = "#{Lambda.Timeout}"
retry_count                      = "#{Lambda.RetryCount}"
trigger_enabled                  = "#{Lambda.TriggerEnabled}"
infra_alerts_topic               = "#{Aws.Sns.InfraAlertsTopicArn}"
daily_cron_schedule              = "#{Lambda.DailyCronSchedule}"
delta_cron_schedule              = "#{Lambda.DeltaCronSchedule}"

# External dependencies
fps_dynamo_db_table = "#{Ext.FpsDynamoDbTable}"
fps_export_queue    = "#{Ext.FpsExportQueue}"

# Environment variables
lambda_env = {
  currencies                = "#{Lambda.Env.Currencies}"
  ignore_departure_airports = "#{Lambda.Env.IgnoreDepartureAirports}"
  ignore_departure_date_to  = "#{Lambda.Env.IgnoreDepartureDateTo}"
  phase_one_enabled         = "#{Lambda.Env.PhaseOneEnabled}"
  availability_threshold    = "#{Lambda.Env.AvailabilityThreshold}"
}

tags = {
  application      = "#{Aws.Tag.Application}"
  cost_centre      = "#{Aws.Tag.CostCentre}"
  environment_type = "#{Aws.Tag.EnvironmentType}"
  support_team     = "#{Aws.Tag.SupportTeam}"
}
