data "aws_kms_key" "secrets_manager" {
  key_id = var.secrets_manager_kms_key_id
}

data "aws_secretsmanager_secret" "feefo_api_secret" {
  name = var.lambda_env.feefo_secret_name
}

data "aws_secretsmanager_secret" "eskel_secret" {
  name = var.lambda_env.eskel_secret_name
}

resource "aws_secretsmanager_secret" "marketing_email_encryption_secret" {
  name        = var.lambda_env.marketing_secret_name
  description = "Keys for marketing email encryption"
  kms_key_id  = data.aws_kms_key.secrets_manager.id
}