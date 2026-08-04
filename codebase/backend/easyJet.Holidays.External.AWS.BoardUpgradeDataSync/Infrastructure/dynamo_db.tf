locals {
  dynamo_db_table_prefix   = "web-${lower(var.environment_name)}"
  board_upgrade_table_name = "${local.dynamo_db_table_prefix}-board-upgrade"
}

resource "aws_dynamodb_table" "board_upgrade" {
  name         = local.board_upgrade_table_name
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
    Name = "${local.board_upgrade_table_name}"
  }

  lifecycle {
    prevent_destroy = false
  }
}
