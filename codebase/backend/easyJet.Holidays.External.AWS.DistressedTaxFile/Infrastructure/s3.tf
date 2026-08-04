# Bucket for input files (FPS). Input will be switched to the main distressed bucket at some point
data "aws_s3_bucket" "fps_files" {
  bucket = var.fps_files_bucket
}

# Bucket for storing distressed files, as well as tax files
locals {
  distressed_files_bucket_name = lower("ejh-distressed-files-${var.environment_name}")
}

resource "aws_s3_bucket" "distressed_files" {
  bucket = local.distressed_files_bucket_name

  tags = {
    Name = local.distressed_files_bucket_name
  }
}

resource "aws_s3_bucket_public_access_block" "distressed_files" {
  bucket = aws_s3_bucket.distressed_files.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "distressed_files" {
  bucket = aws_s3_bucket.distressed_files.id

  rule {
    bucket_key_enabled = true

    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_versioning" "distressed_files" {
  bucket = aws_s3_bucket.distressed_files.id

  versioning_configuration {
    status = "Enabled"
  }
}
