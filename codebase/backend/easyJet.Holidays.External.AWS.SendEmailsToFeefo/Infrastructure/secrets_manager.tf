data "aws_kms_key" "secrets_manager" {
  key_id = var.secrets_manager_kms_key_id
}

data "aws_secretsmanager_secret" "feefo_api_secret" {
  name = var.lambda_env.feefo_secret_name
}