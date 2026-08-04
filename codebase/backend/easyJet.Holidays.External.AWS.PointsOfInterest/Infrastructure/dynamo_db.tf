locals {
  poi_table_name = "web-${lower(var.environment_name)}-points-of-interest"
}

resource "aws_dynamodb_table" "points_of_interest" {
  name         = local.poi_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "ResortCode"
  range_key    = "PlaceId"

  point_in_time_recovery {
    enabled = false
  }

  attribute {
    name = "PlaceId"
    type = "S"
  }

  attribute {
    name = "ResortCode"
    type = "S"
  }

  tags = {
    Name = local.poi_table_name
  }

  lifecycle {
    prevent_destroy = false
  }
}
