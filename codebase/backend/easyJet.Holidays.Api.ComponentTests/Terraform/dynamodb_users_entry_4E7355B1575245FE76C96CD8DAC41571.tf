resource "aws_dynamodb_table_item" "users_entry_4E7355B1575245FE76C96CD8DAC41571" {
  table_name = aws_dynamodb_table.users.name
  hash_key   = aws_dynamodb_table.users.hash_key

  depends_on = [
    aws_dynamodb_table.users
  ]

  item = <<ITEM
{
    "Id": { "N": "24103" },
    "MemberId": { "S": "4E7355B1575245FE76C96CD8DAC41571" }
}
ITEM
}