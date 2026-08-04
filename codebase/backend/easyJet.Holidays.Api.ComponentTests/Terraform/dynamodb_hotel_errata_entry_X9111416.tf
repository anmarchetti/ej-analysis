resource "aws_dynamodb_table_item" "hotel_errata_entry_X9111416" {
  table_name = aws_dynamodb_table.hotel_errata.name
  hash_key   = aws_dynamodb_table.hotel_errata.hash_key

  depends_on = [
    aws_dynamodb_table.hotel_errata
  ]

  item = <<ITEM
{
    "Code": {
        "S": "X9111416"
    },
    "ErratasInfo": {
        "S": "[{\"Errata\":\"Just so you know, the aquapark is open from mid-May to mid-September, weather permitting.\",\"ErrataCode\":0,\"EffectiveDate\":\"2023-03-28T00:00:00\",\"DepartureStartDate\":\"2023-03-28T00:00:00\",\"DepartureEndDate\":\"2050-12-31T00:00:00\",\"BookStartDate\":\"2023-03-28T00:00:00\",\"BookEndDate\":\"2050-12-31T00:00:00\",\"LanguageCode\":\"en\"}]"
    }
}
ITEM
}