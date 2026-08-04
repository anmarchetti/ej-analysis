locals {
  s3_bucket_name = "ejh-web-${lower(var.environment_name)}-routes-files"
}

resource "aws_s3_bucket" "routes_file" {
  bucket = local.s3_bucket_name

  tags = {
    Name = local.s3_bucket_name
  }
}

resource "aws_s3_bucket_public_access_block" "routes_file" {
  bucket = aws_s3_bucket.routes_file.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "routes_file" {
  bucket = aws_s3_bucket.routes_file.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_versioning" "routes_file" {
  bucket = aws_s3_bucket.routes_file.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_logging" "routes_file" {
  bucket = aws_s3_bucket.routes_file.id

  target_bucket = var.s3_access_logging_bucket
  target_prefix = "${local.s3_bucket_name}/"
}
