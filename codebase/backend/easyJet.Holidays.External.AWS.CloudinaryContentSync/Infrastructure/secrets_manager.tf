data "aws_kms_key" "secrets_manager" {
  key_id = var.secrets_manager_kms_key_id
}

resource "aws_secretsmanager_secret" "cloudinary" {
  name       = "Web/Cloudinary/${title(var.environment_name)}"
  kms_key_id = data.aws_kms_key.secrets_manager.id
}
