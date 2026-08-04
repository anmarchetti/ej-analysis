data "aws_secretsmanager_secret" "orchestrator" {
  name = "Web/Orchestrator"
}

data "aws_kms_key" "secrets_manager" {
  key_id = data.aws_secretsmanager_secret.orchestrator.kms_key_id
}
