environment_name                 = "#{FPS.EnvironmentName}"
region                           = "#{Aws.Region}"
lambda_deployment_package_bucket = "#{Aws.S3.LambdaPackagesBucket}"
lambda_deployment_package_key    = "#{Lambda.PackageKey}"
memory_size                      = "#{Lambda.MemorySize}"
timeout                          = "#{Lambda.Timeout}"
sqs_trigger_enabled              = "#{Lambda.SqsTriggerEnabled}"
sqs_trigger_batch_size           = "#{Lambda.SqsTriggerBatchSize}"
sqs_max_receive_count            = "#{Lambda.SqsMaxReceiveCount}"
sqs_max_concurrency              = "#{Lambda.SqsMaxConcurrency}"
infra_alerts_topic               = "#{Aws.Sns.InfraAlertsTopicArn}"

# External dependencies
event_bus_execution_role = "#{Ext.EventBusExecutionRole}"

# Environment variables
lambda_env = {
  currencies = "#{Lambda.Env.Currencies}"
}

tags = {
  application      = "#{Aws.Tag.Application}"
  cost_centre      = "#{Aws.Tag.CostCentre}"
  environment_type = "#{Aws.Tag.EnvironmentType}"
  support_team     = "#{Aws.Tag.SupportTeam}"
}
