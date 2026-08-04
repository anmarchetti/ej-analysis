resource "aws_s3_bucket" "tourist_tax_rules" {
  bucket = "ejh-web-ci-tourist-tax"
}

resource "aws_s3_object" "tourist_tax_rules_csv" {
  bucket = aws_s3_bucket.tourist_tax_rules.bucket
  key    = "Tourist Tax Rules.csv"
  source = "${path.module}/Tourist Tax Rules.csv"
  etag   = filemd5("${path.module}/Tourist Tax Rules.csv")
}

resource "aws_s3_object" "tourist_tax_rates_csv" {
  bucket = aws_s3_bucket.tourist_tax_rules.bucket
  key    = "Exchange Rates.csv"
  source = "${path.module}/Exchange Rates.csv"
  etag   = filemd5("${path.module}/Exchange Rates.csv")
}