resource "aws_dynamodb_table_item" "weather_ESMJ" {
  table_name = aws_dynamodb_table.weather.name
  hash_key   = aws_dynamodb_table.weather.hash_key

  depends_on = [
    aws_dynamodb_table.weather
  ]

  item = <<ITEM
{
    "RainyDays": {
        "L": [
            {
                "N": "4"
            },
            {
                "N": "3"
            },
            {
                "N": "3"
            },
            {
                "N": "3"
            },
            {
                "N": "4"
            },
            {
                "N": "4"
            },
            {
                "N": "5"
            },
            {
                "N": "6"
            },
            {
                "N": "5"
            },
            {
                "N": "5"
            },
            {
                "N": "4"
            },
            {
                "N": "4"
            }
        ]
    },
    "AverageTemp": {
        "L": [
            {
                "N": "22"
            },
            {
                "N": "21"
            },
            {
                "N": "18"
            },
            {
                "N": "14"
            },
            {
                "N": "11"
            },
            {
                "N": "8"
            },
            {
                "N": "7"
            },
            {
                "N": "8"
            },
            {
                "N": "10"
            },
            {
                "N": "13"
            },
            {
                "N": "16"
            },
            {
                "N": "19"
            }
        ]
    },
    "Region": {
        "S": "ESMJ"
    }
}
ITEM
}

resource "aws_dynamodb_table_item" "weather_ESFJ" {
  table_name = aws_dynamodb_table.weather.name
  hash_key   = aws_dynamodb_table.weather.hash_key

  depends_on = [
    aws_dynamodb_table.weather
  ]

  item = <<ITEM
{
    "RainyDays": {
        "L": [
            {
                "N": "4"
            },
            {
                "N": "3"
            },
            {
                "N": "3"
            },
            {
                "N": "3"
            },
            {
                "N": "4"
            },
            {
                "N": "4"
            },
            {
                "N": "5"
            },
            {
                "N": "6"
            },
            {
                "N": "5"
            },
            {
                "N": "5"
            },
            {
                "N": "4"
            },
            {
                "N": "4"
            }
        ]
    },
    "AverageTemp": {
        "L": [
            {
                "N": "22"
            },
            {
                "N": "21"
            },
            {
                "N": "18"
            },
            {
                "N": "14"
            },
            {
                "N": "11"
            },
            {
                "N": "8"
            },
            {
                "N": "7"
            },
            {
                "N": "8"
            },
            {
                "N": "10"
            },
            {
                "N": "13"
            },
            {
                "N": "16"
            },
            {
                "N": "19"
            }
        ]
    },
    "Region": {
        "S": "ESFJ"
    }
}
ITEM
}

resource "aws_dynamodb_table_item" "weather_MTMT" {
  table_name = aws_dynamodb_table.weather.name
  hash_key   = aws_dynamodb_table.weather.hash_key

  depends_on = [
    aws_dynamodb_table.weather
  ]

  item = <<ITEM
{
    "RainyDays": {
        "L": [
            {
                "N": "4"
            },
            {
                "N": "3"
            },
            {
                "N": "3"
            },
            {
                "N": "3"
            },
            {
                "N": "4"
            },
            {
                "N": "4"
            },
            {
                "N": "5"
            },
            {
                "N": "6"
            },
            {
                "N": "5"
            },
            {
                "N": "5"
            },
            {
                "N": "4"
            },
            {
                "N": "4"
            }
        ]
    },
    "AverageTemp": {
        "L": [
            {
                "N": "22"
            },
            {
                "N": "21"
            },
            {
                "N": "18"
            },
            {
                "N": "14"
            },
            {
                "N": "11"
            },
            {
                "N": "8"
            },
            {
                "N": "7"
            },
            {
                "N": "8"
            },
            {
                "N": "10"
            },
            {
                "N": "13"
            },
            {
                "N": "16"
            },
            {
                "N": "19"
            }
        ]
    },
    "Region": {
        "S": "MTMT"
    }
}
ITEM
}

resource "aws_dynamodb_table_item" "weather_ESFU" {
  table_name = aws_dynamodb_table.weather.name
  hash_key   = aws_dynamodb_table.weather.hash_key

  depends_on = [
    aws_dynamodb_table.weather
  ]

  item = <<ITEM
{
    "RainyDays": {
        "L": [
            {
                "N": "4"
            },
            {
                "N": "3"
            },
            {
                "N": "3"
            },
            {
                "N": "3"
            },
            {
                "N": "4"
            },
            {
                "N": "4"
            },
            {
                "N": "5"
            },
            {
                "N": "6"
            },
            {
                "N": "5"
            },
            {
                "N": "5"
            },
            {
                "N": "4"
            },
            {
                "N": "4"
            }
        ]
    },
    "AverageTemp": {
        "L": [
            {
                "N": "22"
            },
            {
                "N": "21"
            },
            {
                "N": "18"
            },
            {
                "N": "14"
            },
            {
                "N": "11"
            },
            {
                "N": "8"
            },
            {
                "N": "7"
            },
            {
                "N": "8"
            },
            {
                "N": "10"
            },
            {
                "N": "13"
            },
            {
                "N": "16"
            },
            {
                "N": "19"
            }
        ]
    },
    "Region": {
        "S": "ESFU"
    }
}
ITEM
}

resource "aws_dynamodb_table_item" "weather_GRSK" {
  table_name = aws_dynamodb_table.weather.name
  hash_key   = aws_dynamodb_table.weather.hash_key

  depends_on = [
    aws_dynamodb_table.weather
  ]

  item = <<ITEM
{
    "RainyDays": {
        "L": [
            {
                "N": "4"
            },
            {
                "N": "3"
            },
            {
                "N": "3"
            },
            {
                "N": "3"
            },
            {
                "N": "4"
            },
            {
                "N": "4"
            },
            {
                "N": "5"
            },
            {
                "N": "6"
            },
            {
                "N": "5"
            },
            {
                "N": "5"
            },
            {
                "N": "4"
            },
            {
                "N": "4"
            }
        ]
    },
    "AverageTemp": {
        "L": [
            {
                "N": "22"
            },
            {
                "N": "21"
            },
            {
                "N": "18"
            },
            {
                "N": "14"
            },
            {
                "N": "11"
            },
            {
                "N": "8"
            },
            {
                "N": "7"
            },
            {
                "N": "8"
            },
            {
                "N": "10"
            },
            {
                "N": "13"
            },
            {
                "N": "16"
            },
            {
                "N": "19"
            }
        ]
    },
    "Region": {
        "S": "GRSK"
    }
}
ITEM
}