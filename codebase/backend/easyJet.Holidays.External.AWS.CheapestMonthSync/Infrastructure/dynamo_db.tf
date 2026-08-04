locals {
  cheapest_month_sync_name = "web-${lower(var.environment_name)}-cheapest-month-sync"
  routes_date_name         = "web-${lower(var.environment_name)}-routes-date"
  routes_ver_name          = "web-${lower(var.environment_name)}-routes-ver"
}

resource "aws_dynamodb_table" "cheapest_month_sync" {
  name         = local.cheapest_month_sync_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "Airport"
  range_key    = "Destination"

  point_in_time_recovery {
    enabled = true
  }

  attribute {
    name = "Airport"
    type = "S"
  }

  attribute {
    name = "Destination"
    type = "S"
  }

  ttl {
    attribute_name = "ExpiresAt"
    enabled        = true
  }

  tags = {
    Name = local.cheapest_month_sync_name
  }

  lifecycle {
    prevent_destroy = false
  }
}

data "aws_dynamodb_table" "routes_date" {
  name = local.routes_date_name
}

data "aws_dynamodb_table" "routes_ver" {
  name = local.routes_ver_name
}
