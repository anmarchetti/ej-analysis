data "aws_kms_key" "secrets_manager" {
  key_id = data.aws_secretsmanager_secret.atcom_db.kms_key_id
}

data "aws_secretsmanager_secret" "atcom_db" {
  name = var.lambda_env.atcom_db_secret_name
}
