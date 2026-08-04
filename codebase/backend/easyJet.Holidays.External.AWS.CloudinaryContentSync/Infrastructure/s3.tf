# Bucket for terraform state
resource "aws_s3_bucket" "hotel_content" {
  bucket = var.hotel_content_bucket_name

  tags = {
    Name = var.hotel_content_bucket_name
  }
}

resource "aws_s3_bucket_public_access_block" "hotel_content" {
  bucket = aws_s3_bucket.hotel_content.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "hotel_content" {
  bucket = aws_s3_bucket.hotel_content.id

  rule {
    bucket_key_enabled = true

    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_versioning" "hotel_content" {
  bucket = aws_s3_bucket.hotel_content.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_cors_configuration" "hotel_content" {
  count = var.hotel_content_bucket_allowed_cors_origins != "" ? 1 : 0

  bucket = aws_s3_bucket.hotel_content.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["POST", "GET", "PUT", "DELETE", "HEAD"]
    allowed_origins = split(",", var.hotel_content_bucket_allowed_cors_origins)
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}
