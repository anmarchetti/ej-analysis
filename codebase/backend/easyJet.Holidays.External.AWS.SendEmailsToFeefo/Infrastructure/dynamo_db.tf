data "aws_dynamodb_table" "auth_tokens" {
  name = var.auth_tokens_table_name
}
