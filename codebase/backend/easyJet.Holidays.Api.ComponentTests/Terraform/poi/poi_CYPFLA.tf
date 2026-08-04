resource "aws_dynamodb_table_item" "poi_CYPFLA_some_waterfall" {
  table_name = aws_dynamodb_table.points_of_interest.name
  hash_key   = aws_dynamodb_table.points_of_interest.hash_key
  range_key  = aws_dynamodb_table.points_of_interest.range_key

  depends_on = [
    aws_dynamodb_table.points_of_interest
  ]

  item = <<ITEM
{
  "ResortCode": {
    "S": "CYPFLA"
  },
  "PlaceId": {
    "S": "AQAAAFUACSV5GIHI6Ip1nod0p2MMqe4xOxRRnZl_Vu5V8Vy15i0JZsAfa8hUCdgjQRrS1BX9kAAsL8NWiJx-6ngmOLzHQiFpuT-1hO1tZ5hx8A45_BBXjlRwEA76TJihHRtgaCOt396mtu4z-LtDLgE1cBQwM6kdeeOw"
  },
  "AdultsOnly": {
    "BOOL": false
  },
  "Category": {
    "S": "Nature"
  },
  "CreatedAt": {
    "S": "2025-12-09T09:16:49.8783004Z"
  },
  "Hidden": {
    "BOOL": false
  },
  "Id": {
    "S": "9938cb0a-3001-456b-b872-5beb7e9ddb26"
  },
  "Keep": {
    "BOOL": false
  },
  "NumberOfVisits": {
    "N": "360"
  },
  "PlaceType": {
    "S": "PointOfInterest"
  },
  "Position": {
    "L": [
      {
        "N": "32.43577"
      },
      {
        "N": "34.96366"
      }
    ]
  },
  "PrimaryCategory": {
    "M": {
      "Id": {
        "S": "waterfall"
      },
      "LocalizedName": {
        "S": "Waterfall"
      },
      "Name": {
        "S": "Waterfall"
      },
      "Primary": {
        "BOOL": true
      }
    }
  },
  "QueryPositionLatitude": {
    "N": "35.04342"
  },
  "QueryPositionLongitude": {
    "N": "32.37088"
  },
  "ResortName": {
    "S": "Latchi"
  },
  "Title": {
    "M": {
      "en": {
        "S": "Kremiotis Waterfall"
      }
    }
  }
}
ITEM
}

resource "aws_dynamodb_table_item" "poi_CYPFLA_some_bar" {
  table_name = aws_dynamodb_table.points_of_interest.name
  hash_key   = aws_dynamodb_table.points_of_interest.hash_key
  range_key  = aws_dynamodb_table.points_of_interest.range_key

  depends_on = [
    aws_dynamodb_table.points_of_interest
  ]

  item = <<ITEM
{
  "ResortCode": {
    "S": "CYPFLA"
  },
  "PlaceId": {
    "S": "AQAAAFUA1nHhiPl-C1SYT_p41A_ZlZD81-wMabn0vJhUvctCpnOnE8oS-XTwx-9nhczHL6Ib1X7t977DjY_Vk45qCOOUJlMRaj9AY0hJ0JXtJG0v9YCfMHIAAlzDSzwS9aWF1ojjrOLtpdX_fkJKC8t86Cbl3zDbZkLz"
  },
  "AdultsOnly": {
    "BOOL": true
  },
  "Category": {
    "S": "Amenities"
  },
  "CreatedAt": {
    "S": "2025-12-09T09:16:49.8885914Z"
  },
  "Hidden": {
    "BOOL": false
  },
  "Id": {
    "S": "2d417072-bfbe-4d70-a876-89ddff19c04a"
  },
  "Keep": {
    "BOOL": false
  },
  "NumberOfVisits": {
    "N": "780"
  },
  "PlaceType": {
    "S": "PointOfInterest"
  },
  "Position": {
    "L": [
      {
        "N": "32.38782"
      },
      {
        "N": "34.82794"
      }
    ]
  },
  "PrimaryCategory": {
    "M": {
      "Id": {
        "S": "bar_or_pub"
      },
      "LocalizedName": {
        "S": "Bar or Pub"
      },
      "Name": {
        "S": "Bar or Pub"
      },
      "Primary": {
        "BOOL": true
      }
    }
  },
  "QueryPositionLatitude": {
    "N": "35.04342"
  },
  "QueryPositionLongitude": {
    "N": "32.37088"
  },
  "ResortName": {
    "S": "Latchi"
  },
  "Title": {
    "M": {
      "en": {
        "S": "Waves Beach Bar"
      }
    }
  }
}
ITEM
}