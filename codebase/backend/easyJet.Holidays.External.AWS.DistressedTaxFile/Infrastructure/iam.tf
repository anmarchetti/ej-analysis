# Renamed resource to be consistent with all other lambdas, cleanup next sprint
moved {
  from = aws_iam_role.lambda_function_full_role
  to   = aws_iam_role.lambda_function
}

resource "aws_iam_role" "lambda_function" {
  name = local.lambda_function_name

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Sid    = ""
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      },
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_vpc_access" {
  role       = aws_iam_role.lambda_function.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

# Renamed resource to be consistent with all other lambdas, cleanup next sprint
moved {
  from = aws_iam_role_policy.lambda_function_full_policy
  to   = aws_iam_role_policy.lambda_function
}

resource "aws_iam_role_policy" "lambda_function" {
  name   = "lambda_function_policy"
  role   = aws_iam_role.lambda_function.id
  policy = data.aws_iam_policy_document.lambda_function_policy.json
}

data "aws_iam_policy_document" "lambda_function_policy" {
  statement {
    sid = "TempFpsBucketList"
    actions = [
      "s3:ListBucket",
    ]

    resources = [
      data.aws_s3_bucket.fps_files.arn,
    ]
  }

  statement {
    sid = "TempFpsBucketProcess"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
    ]

    resources = [
      "${data.aws_s3_bucket.fps_files.arn}/*",
    ]
  }

  statement {
    actions = [
      "s3:ListBucket",
    ]

    resources = [
      aws_s3_bucket.distressed_files.arn,
    ]
  }

  statement {
    actions = [
      "s3:GetObject",
      "s3:PutObject",
    ]

    resources = [
      "${aws_s3_bucket.distressed_files.arn}/*",
    ]
  }
}
