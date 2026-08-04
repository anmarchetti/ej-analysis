data "aws_s3_bucket" "tourist_tax" {
  bucket = var.tourist_tax_bucket_name
}