locals {
  dynamo_db_table_prefix         = "web-${lower(var.environment_name)}"
  hbg_hotel_discounts_table_name = "${local.dynamo_db_table_prefix}-hbg-hotel-discounts-sync"
}

resource "aws_dynamodb_table" "hbg_hotel_discounts" {
  name         = local.hbg_hotel_discounts_table_name
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
    Name = "${local.hbg_hotel_discounts_table_name}"
  }

  lifecycle {
    prevent_destroy = false
  }
}
