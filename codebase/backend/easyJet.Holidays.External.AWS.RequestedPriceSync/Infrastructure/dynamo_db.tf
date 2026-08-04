locals {
  requested_price_table_name = "web-${lower(var.environment_name)}-requested-price"
}

resource "aws_dynamodb_table" "requested_price_table" {
  name         = local.requested_price_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "Code"
  range_key    = "SearchType"

  point_in_time_recovery {
    enabled = true
  }

  attribute {
    name = "Code"
    type = "S"
  }

  attribute {
    name = "SearchType"
    type = "S"
  }

  tags = {
    Name = local.requested_price_table_name
  }

  lifecycle {
    prevent_destroy = false
  }
}
