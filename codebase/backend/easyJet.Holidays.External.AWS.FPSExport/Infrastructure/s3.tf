locals {
  bucket_name = "ejh-fps-files-${lower(var.environment_name)}"
}

resource "aws_s3_bucket" "fps_files" {
  bucket = local.bucket_name

  tags = {
    Name = local.bucket_name
  }
}

resource "aws_s3_bucket_public_access_block" "fps_files" {
  bucket = aws_s3_bucket.fps_files.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "fps_files" {
  bucket = aws_s3_bucket.fps_files.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_versioning" "fps_files" {
  bucket = aws_s3_bucket.fps_files.id

  versioning_configuration {
    status = "Enabled"
  }
}
