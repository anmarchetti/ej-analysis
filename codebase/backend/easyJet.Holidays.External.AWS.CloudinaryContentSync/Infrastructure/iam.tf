resource "aws_iam_role" "lambda_function_role" {
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
  role       = aws_iam_role.lambda_function_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

resource "aws_iam_role_policy" "lambda_function_policy" {
  name   = "lambda_function_policy"
  role   = aws_iam_role.lambda_function_role.id
  policy = data.aws_iam_policy_document.lambda_function_policy.json
}

data "aws_iam_policy_document" "lambda_function_policy" {
  statement {
    actions = [
      "secretsmanager:GetSecretValue",
    ]
    resources = [
      aws_secretsmanager_secret.cloudinary.arn
    ]
  }

  statement {
    actions = [
      "kms:Decrypt",
    ]
    resources = [
      data.aws_kms_key.secrets_manager.arn
    ]
  }

  statement {
    actions = [
      "s3:GetObject",
      "s3:PutObjectTagging",
    ]
    resources = [
      "${aws_s3_bucket.hotel_content.arn}/*"
    ]
  }
}
