locals {
  dynamodb_table_name = "fps-flight-fare-changes-${lower(var.environment_name)}"
}

resource "aws_dynamodb_table" "flight_price_storedata" {
  name                        = local.dynamodb_table_name
  billing_mode                = "PAY_PER_REQUEST"
  hash_key                    = "ID"
  range_key                   = "UpdateDateTime"
  deletion_protection_enabled = true

  point_in_time_recovery {
    enabled = true
  }

  attribute {
    name = "ID"
    type = "S"
  }

  attribute {
    name = "UpdateDateTime"
    type = "S"
  }

  attribute {
    name = "FlightKey"
    type = "S"
  }

  tags = {
    Name = local.dynamodb_table_name
  }
}

# Migrating to the separate resourse for managing GSI
# Should be removed once applied everywhere
import {
  to = aws_dynamodb_global_secondary_index.flight_price_storedata_flight_key
  id = "${aws_dynamodb_table.flight_price_storedata.name},FlightKey-index"
}

resource "aws_dynamodb_global_secondary_index" "flight_price_storedata_flight_key" {
  table_name = aws_dynamodb_table.flight_price_storedata.name
  index_name = "FlightKey-index"

  projection {
    projection_type = "KEYS_ONLY"
  }

  key_schema {
    attribute_name = "FlightKey"
    attribute_type = "S"
    key_type       = "HASH"
  }
}
