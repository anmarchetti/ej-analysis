locals {
  dynamo_db_table_prefix   = "web-${lower(var.environment_name)}"
  hotel_errata_table_name  = "${local.dynamo_db_table_prefix}-hotel-errata"
  flight_errata_table_name = "${local.dynamo_db_table_prefix}-flight-errata"
}

resource "aws_dynamodb_table" "hotel_errata" {
  name         = local.hotel_errata_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "Code"

  point_in_time_recovery {
    enabled = true
  }

  attribute {
    name = "Code"
    type = "S"
  }

  tags = {
    Name = local.hotel_errata_table_name
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_dynamodb_table" "flight_errata" {
  name         = local.flight_errata_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "Code"

  point_in_time_recovery {
    enabled = true
  }

  attribute {
    name = "Code"
    type = "S"
  }

  tags = {
    Name = local.flight_errata_table_name
  }

  lifecycle {
    prevent_destroy = false
  }
}

