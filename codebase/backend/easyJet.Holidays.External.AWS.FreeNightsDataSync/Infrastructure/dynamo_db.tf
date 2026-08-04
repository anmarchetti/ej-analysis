locals {
  dynamo_db_table_prefix = "web-${lower(var.environment_name)}"
  free_nights_table_name = "${local.dynamo_db_table_prefix}-free-nights"
}

resource "aws_dynamodb_table" "free_nights" {
  name         = local.free_nights_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "AccommodationCode"

  point_in_time_recovery {
    enabled = true
  }

  attribute {
    name = "AccommodationCode"
    type = "S"
  }

  tags = {
    Name = "${local.free_nights_table_name}"
  }

  lifecycle {
    prevent_destroy = false
  }
}
