locals {
  fps_replication_prefixes = [
    for folder in split(",", var.lambda_env.upload_bucket_folders) : "${trimspace(folder)}/"
  ]
}

# Replication config is temporary, until Atcom switches to the new S3 bucket
resource "aws_s3_bucket_replication_configuration" "distressed_files" {
  count = var.enable_fps_bucket_replication ? 1 : 0

  bucket = aws_s3_bucket.distressed_files.id
  role   = aws_iam_role.distressed_files_replication[0].arn

  dynamic "rule" {
    for_each = {
      for index, prefix in local.fps_replication_prefixes : prefix => index
    }

    content {
      id       = "replicate-${replace(trim(rule.key, "/"), "/", "-")}-to-fps"
      priority = rule.value + 1
      status   = "Enabled"

      filter {
        prefix = rule.key
      }

      delete_marker_replication {
        status = "Disabled"
      }

      destination {
        bucket = data.aws_s3_bucket.fps_files.arn
      }
    }
  }
}


resource "aws_iam_role" "distressed_files_replication" {
  count = var.enable_fps_bucket_replication ? 1 : 0

  name = "${local.distressed_files_bucket_name}-replication"

  assume_role_policy = data.aws_iam_policy_document.distressed_files_replication_assume_role[0].json
}

data "aws_iam_policy_document" "distressed_files_replication_assume_role" {
  count = var.enable_fps_bucket_replication ? 1 : 0

  statement {
    actions = [
      "sts:AssumeRole",
    ]

    principals {
      type = "Service"
      identifiers = [
        "s3.amazonaws.com",
      ]
    }
  }
}

resource "aws_iam_role_policy" "distressed_files_replication" {
  count = var.enable_fps_bucket_replication ? 1 : 0

  name   = "distressed_files_replication_policy"
  role   = aws_iam_role.distressed_files_replication[0].id
  policy = data.aws_iam_policy_document.distressed_files_replication_policy[0].json
}


data "aws_iam_policy_document" "distressed_files_replication_policy" {
  count = var.enable_fps_bucket_replication ? 1 : 0

  statement {
    actions = [
      "s3:GetReplicationConfiguration",
      "s3:ListBucket",
    ]

    resources = [
      aws_s3_bucket.distressed_files.arn,
    ]
  }

  statement {
    actions = [
      "s3:GetObjectVersion",
      "s3:GetObjectVersionAcl",
      "s3:GetObjectVersionForReplication",
      "s3:GetObjectVersionTagging",
    ]

    resources = [
      "${aws_s3_bucket.distressed_files.arn}/*",
    ]
  }

  statement {
    actions = [
      "s3:ObjectOwnerOverrideToBucketOwner",
      "s3:ReplicateDelete",
      "s3:ReplicateObject",
      "s3:ReplicateTags",
    ]

    resources = [
      "${data.aws_s3_bucket.fps_files.arn}/*",
    ]
  }
}
