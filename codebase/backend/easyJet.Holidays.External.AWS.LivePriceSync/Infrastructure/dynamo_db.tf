locals {
  dynamo_db_table_prefix = "web-${lower(var.environment_name)}"
  live_price_table_name  = "${local.dynamo_db_table_prefix}-live-price"
}

resource "aws_dynamodb_table" "live_price_table" {
  name         = local.live_price_table_name
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

  ttl {
    attribute_name = "Expires"
    enabled        = true
  }

  tags = {
    Name = local.live_price_table_name
  }

  lifecycle {
    prevent_destroy = false
  }
}
