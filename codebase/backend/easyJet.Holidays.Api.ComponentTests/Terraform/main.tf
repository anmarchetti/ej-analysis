terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "5.31.0"
    }
  }
}

variable "aws_base_url" {
  type    = string
  default = "http://127.0.0.1:4566"
}

variable "name" {
  type    = string
  default = ""
}
variable "port" {
  type    = string
  default = ""
}

provider "aws" {
  region                      = "eu-west-1"
  access_key                  = "fake"
  secret_key                  = "fake"
  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true
  s3_use_path_style           = true # used to turn off the subdomain-style urls and to not mess with the DNS setup

  # "var.name" is the alias inside docker. it is equal to the container name, provided via WithName() option
  endpoints {
    apigateway      = "http://${var.name}:${var.port}"
    apigatewayv2    = "http://${var.name}:${var.port}"
    cloudformation  = "http://${var.name}:${var.port}"
    cloudwatch      = "http://${var.name}:${var.port}"
    cognitoidp      = "http://${var.name}:${var.port}"
    cognitoidentity = "http://${var.name}:${var.port}"
    dynamodb        = "http://${var.name}:${var.port}"
    ec2             = "http://${var.name}:${var.port}"
    es              = "http://${var.name}:${var.port}"
    elasticache     = "http://${var.name}:${var.port}"
    firehose        = "http://${var.name}:${var.port}"
    iam             = "http://${var.name}:${var.port}"
    kinesis         = "http://${var.name}:${var.port}"
    lambda          = "http://${var.name}:${var.port}"
    rds             = "http://${var.name}:${var.port}"
    redshift        = "http://${var.name}:${var.port}"
    route53         = "http://${var.name}:${var.port}"
    s3              = "http://${var.name}:${var.port}"
    secretsmanager  = "http://${var.name}:${var.port}"
    ses             = "http://${var.name}:${var.port}"
    sns             = "http://${var.name}:${var.port}"
    sqs             = "http://${var.name}:${var.port}"
    ssm             = "http://${var.name}:${var.port}"
    stepfunctions   = "http://${var.name}:${var.port}"
    sts             = "http://${var.name}:${var.port}"
  }
}

module "poi" {
  source = "./poi"
}

module "tourist-tax" {
  source = "./tourist-tax"
}

# S3 buckets

resource "aws_s3_bucket" "website_attachments" {
  bucket = "ejh-web-dev-website-attachments"
}

# SNS topics
resource "aws_sns_topic" "price_promise" {
  name = "web-dev-price-promise-notifications-topic"
}

resource "aws_sns_topic" "lease_flights_notification_emails" {
  name = "easyjet-holidays-lease-flights-notification-emails"
}

resource "aws_sns_topic" "trade_agent_feedback_email" {
  name = "web-dev-trade-agent-feedback-notifications-topic"
}

resource "aws_sns_topic" "group_booking_email" {
  name = "easyjet-holidays-group-booking-email-nonprod"
}

# DynamoDB tables

resource "aws_dynamodb_table" "routes_to" {
  name         = "web-ci-routes-to"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "version"
  range_key    = "departure"

  attribute {
    name = "version"
    type = "N"
  }

  attribute {
    name = "departure"
    type = "S"
  }
}

resource "aws_dynamodb_table" "routes_from" {
  name         = "web-ci-routes-from"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "version"
  range_key    = "arrival"

  attribute {
    name = "version"
    type = "N"
  }

  attribute {
    name = "arrival"
    type = "S"
  }
}

resource "aws_dynamodb_table" "routes_date" {
  name         = "web-ci-routes-date"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "version"
  range_key    = "month"

  attribute {
    name = "version"
    type = "N"
  }

  attribute {
    name = "month"
    type = "S"
  }
}

resource "aws_dynamodb_table" "routes_ver" {
  name         = "web-ci-routes-ver"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "version"

  attribute {
    name = "version"
    type = "N"
  }
}

resource "aws_dynamodb_table" "users_counter" {
  name         = "web-ci-users-counter"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "Name"

  attribute {
    name = "Name"
    type = "S"
  }
}

resource "aws_dynamodb_table" "users" {
  name         = "web-ci-users"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "MemberId"

  attribute {
    name = "MemberId"
    type = "S"
  }
}

resource "aws_dynamodb_table" "booking_transactions" {
  name         = "web-ci-booking-transactions"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "Id"

  attribute {
    name = "Id"
    type = "S"
  }
}

resource "aws_dynamodb_table" "price_changes" {
  name         = "web-ci-price-jumps"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "Date"
  range_key    = "Timestamp"

  attribute {
    name = "Date"
    type = "S"
  }

  attribute {
    name = "Timestamp"
    type = "N"
  }
}

resource "aws_dynamodb_table" "shortlists" {
  name         = "web-ci-shortlists"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "MemberId"
  range_key    = "Grouping"

  attribute {
    name = "MemberId"
    type = "S"
  }

  attribute {
    name = "Grouping"
    type = "S"
  }
}

resource "aws_dynamodb_table" "credits" {
  name         = "web-ci-credit-balance-cache"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "MemberId"

  attribute {
    name = "MemberId"
    type = "S"
  }
}

resource "aws_dynamodb_table" "live_price" {
  name         = "web-ci-live-price"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "Code"
  range_key    = "SearchType"

  attribute {
    name = "Code"
    type = "S"
  }

  attribute {
    name = "SearchType"
    type = "S"
  }
}

resource "aws_dynamodb_table" "price_promise" {
  name         = "web-ci-price-promise-requests"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "Id"

  attribute {
    name = "Id"
    type = "S"
  }
}

resource "aws_dynamodb_table" "hotel_errata" {
  name         = "web-ci-hotel-errata"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "Code"

  attribute {
    name = "Code"
    type = "S"
  }
}

resource "aws_dynamodb_table" "flight_errata" {
  name         = "web-ci-flight-errata"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "Code"

  attribute {
    name = "Code"
    type = "S"
  }
}

resource "aws_dynamodb_table" "requested_price" {
  name         = "web-ci-requested-price"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "Code"
  range_key    = "SearchType"

  attribute {
    name = "Code"
    type = "S"
  }

  attribute {
    name = "SearchType"
    type = "S"
  }
}

resource "aws_dynamodb_table" "free_nights" {
  name         = "web-ci-free-nights"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "AccommodationCode"

  attribute {
    name = "AccommodationCode"
    type = "S"
  }
}

resource "aws_dynamodb_table" "faq_users_responses" {
  name         = "web-ci-faq-feedbacks"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "Question"
  range_key    = "QuestionId"

  attribute {
    name = "Question"
    type = "S"
  }

  attribute {
    name = "QuestionId"
    type = "S"
  }
}

resource "aws_dynamodb_table" "marketing_unsubscribe" {
  name         = "HOL-NONPROD-MARKETING-UNSUBSCRIBE"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "Email"

  attribute {
    name = "Email"
    type = "S"
  }
}

resource "aws_dynamodb_table" "marketing_preferences" {
  name         = "HOL-NONPROD-MARKETING-PREFERENCES"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "Email"

  attribute {
    name = "Email"
    type = "S"
  }
}

resource "aws_dynamodb_table" "marketing_preferences_screened" {
  name         = "HOL-NONPROD-MARKETING-PREFERENCES-SCREENED"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "Email"

  attribute {
    name = "Email"
    type = "S"
  }
}

resource "aws_dynamodb_table" "auth_tokens" {
  name         = "web-ci-auth-token-cache"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "Key"

  attribute {
    name = "Key"
    type = "S"
  }
}

resource "aws_dynamodb_table_item" "salesforce_auth_token" {
  table_name = aws_dynamodb_table.auth_tokens.name
  hash_key   = aws_dynamodb_table.auth_tokens.hash_key

  item = <<ITEM
{
  "Key": {"S": "SalesforceAPI"},
  "AccessToken": {"S": "mock-salesforce-token-for-component-tests"},
  "ExpirationTime": {"S": "2099-12-31T23:59:59.0000000Z"}
}
ITEM
}

resource "aws_dynamodb_table" "feedbacks" {
  name         = "web-ci-post-booking-feedbacks"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "Question"
  range_key    = "QuestionId"

  attribute {
    name = "Question"
    type = "S"
  }

  attribute {
    name = "QuestionId"
    type = "S"
  }
}

resource "aws_dynamodb_table" "booking_sessions" {
  name         = "web-ci-booking-sessions"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "BookingRef"

  attribute {
    name = "BookingRef"
    type = "S"
  }
}

resource "aws_dynamodb_table" "booking_memos" {
  name         = "HOL-NONPROD-BOOKING-MEMOS"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "Id"

  attribute {
    name = "Id"
    type = "S"
  }
}

resource "aws_dynamodb_table" "trade_agent_feedback" {
  name         = "web-ci-trade-agent-feedbacks"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "Id"

  attribute {
    name = "Id"
    type = "S"
  }
}

resource "aws_dynamodb_table" "seat_plan" {
  name         = "web-ci-seat-plan-cache"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "FlightId"

  attribute {
    name = "FlightId"
    type = "S"
  }
}

resource "aws_dynamodb_table" "group_bookings" {
  name         = "web-ci-group-bookings"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "Id"

  attribute {
    name = "Id"
    type = "S"
  }
}

resource "aws_dynamodb_table" "flight_extras" {
  name         = "web-ci-flight-extra-cache"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "FlightId"

  attribute {
    name = "FlightId"
    type = "S"
  }
}

resource "aws_dynamodb_table" "weather" {
  name         = "web-ci-weather-data"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "Region"

  attribute {
    name = "Region"
    type = "S"
  }
}

resource "aws_dynamodb_table" "trip_advisor_cache" {
  name         = "web-ci-tripadvisor-cache"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "Key"

  attribute {
    name = "Key"
    type = "S"
  }
}

resource "aws_dynamodb_table" "search_pod_validation" {
  name         = "web-ci-missed-searches"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "Id"

  attribute {
    name = "Id"
    type = "S"
  }
}

resource "aws_dynamodb_table" "amend_cache" {
  name         = "web-ci-amend-cache"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "HashKey"

  attribute {
    name = "HashKey"
    type = "S"
  }
}
