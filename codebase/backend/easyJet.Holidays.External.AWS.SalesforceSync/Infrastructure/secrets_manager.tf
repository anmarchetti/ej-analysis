resource "aws_kms_alias" "secrets_manager" {
  name          = lower("alias/salesforce-sync-${var.environment_name}-secrets-manager")
  target_key_id = aws_kms_key.secrets_manager.key_id
}

resource "aws_kms_key" "secrets_manager" {
  customer_master_key_spec = "SYMMETRIC_DEFAULT"
  enable_key_rotation      = true
}

resource "aws_secretsmanager_secret" "salesforce" {
  name        = "SalesforceSync/${var.environment_name}"
  description = "Credentials for Salesforce Sync"
  kms_key_id  = aws_kms_key.secrets_manager.key_id
}
