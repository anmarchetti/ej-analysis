resource "aws_iam_policy" "fps_atcom_policy" {
  name   = "Holidays-FpsFilesDownload-${var.environment_name}"
  policy = data.aws_iam_policy_document.fps_atcom_policy.json
}

data "aws_iam_policy_document" "fps_atcom_policy" {
  statement {
    actions = [
      "s3:ListBucket",
      "s3:GetBucketLocation",
    ]

    resources = [
      aws_s3_bucket.fps_files.arn,
    ]
  }

  statement {
    actions = [
      "s3:GetObject",
    ]

    resources = [
      "${aws_s3_bucket.fps_files.arn}/*"
    ]
  }
}
