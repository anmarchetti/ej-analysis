resource "aws_dynamodb_table" "logs_table" {
  name         = var.logs_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "MessageId"

  point_in_time_recovery {
    enabled = true
  }

  attribute {
    name = "MessageId"
    type = "S"
  }

  tags = {
    Name = var.logs_table_name
  }
}
