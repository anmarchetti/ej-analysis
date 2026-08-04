locals {
  routes_date_name = "web-${lower(var.environment_name)}-routes-date"
  routes_ver_name  = "web-${lower(var.environment_name)}-routes-ver"
  routes_to_name   = "web-${lower(var.environment_name)}-routes-to"
}

data "aws_dynamodb_table" "routes_date" {
  name = local.routes_date_name
}

data "aws_dynamodb_table" "routes_ver" {
  name = local.routes_ver_name
}

data "aws_dynamodb_table" "routes_to" {
  name = local.routes_to_name
}

