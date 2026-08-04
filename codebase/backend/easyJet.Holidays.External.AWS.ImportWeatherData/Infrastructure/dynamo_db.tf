locals {
  dynamodb_table_name = "web-${lower(var.environment_name)}-weather-data"
}

resource "aws_dynamodb_table" "weather" {
  name                        = local.dynamodb_table_name
  billing_mode                = "PAY_PER_REQUEST"
  hash_key                    = "Region"
  deletion_protection_enabled = var.dynamo_db_deletion_protection_enabled

  point_in_time_recovery {
    enabled = true
  }

  attribute {
    name = "Region"
    type = "S"
  }

  tags = {
    Name = local.dynamodb_table_name
  }
}
