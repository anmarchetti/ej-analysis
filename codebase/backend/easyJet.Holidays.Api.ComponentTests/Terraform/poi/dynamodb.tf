
resource "aws_dynamodb_table" "points_of_interest" {
  name         = "web-dev-points-of-interest"
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
    Name = "web-dev-points-of-interest"
  }

  lifecycle {
    prevent_destroy = false
  }
}