locals {
  dynamo_db_table_prefix = "web-${lower(var.environment_name)}"
  routes_date_table_name = "${local.dynamo_db_table_prefix}-routes-date"
  routes_from_table_name = "${local.dynamo_db_table_prefix}-routes-from"
  routes_to_table_name   = "${local.dynamo_db_table_prefix}-routes-to"
  routes_ver_table_name  = "${local.dynamo_db_table_prefix}-routes-ver"
}

resource "aws_dynamodb_table" "routes_date" {
  name         = local.routes_date_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "version"
  range_key    = "month"

  point_in_time_recovery {
    enabled = true
  }

  attribute {
    name = "version"
    type = "N"
  }

  attribute {
    name = "month"
    type = "S"
  }

  tags = {
    Name = local.routes_date_table_name
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_dynamodb_table" "routes_from" {
  name         = local.routes_from_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "version"
  range_key    = "arrival"

  point_in_time_recovery {
    enabled = true
  }

  attribute {
    name = "version"
    type = "N"
  }

  attribute {
    name = "arrival"
    type = "S"
  }

  tags = {
    Name = local.routes_from_table_name
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_dynamodb_table" "routes_to" {
  name         = local.routes_to_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "version"
  range_key    = "departure"

  point_in_time_recovery {
    enabled = true
  }

  attribute {
    name = "version"
    type = "N"
  }

  attribute {
    name = "departure"
    type = "S"
  }

  tags = {
    Name = local.routes_to_table_name
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_dynamodb_table" "routes_version" {
  name         = local.routes_ver_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "version"

  point_in_time_recovery {
    enabled = true
  }

  attribute {
    name = "version"
    type = "N"
  }

  tags = {
    Name = local.routes_ver_table_name
  }

  lifecycle {
    prevent_destroy = false
  }
}
