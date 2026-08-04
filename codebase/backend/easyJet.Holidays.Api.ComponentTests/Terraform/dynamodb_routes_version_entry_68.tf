resource "aws_dynamodb_table_item" "routes_version_entry" {
  table_name = aws_dynamodb_table.routes_ver.name
  hash_key   = aws_dynamodb_table.routes_ver.hash_key
  depends_on = [
    aws_dynamodb_table.routes_ver
  ]

  item = <<ITEM
{
    "version": {"N": "68"}
}
ITEM
}