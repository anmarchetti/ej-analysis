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

  managed_policy_arns = [
    "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
  ]
}

resource "aws_iam_role_policy" "lambda_function_policy" {
  name   = "lambda_function_policy"
  role   = aws_iam_role.lambda_function_role.id
  policy = data.aws_iam_policy_document.lambda_function_policy.json
}

data "aws_iam_policy_document" "lambda_function_policy" {
  statement {
    actions = [
      "sqs:ReceiveMessage",
      "sqs:DeleteMessage",
      "sqs:GetQueueAttributes",
    ]
    resources = [
      data.aws_sqs_queue.feefo.arn
    ]
  }

  statement {
    actions = [
      "dynamodb:DescribeTable",
      "dynamodb:Scan",
      "dynamodb:Query",
      "dynamodb:GetItem",
      "dynamodb:UpdateItem",
    ]
    resources = [
      data.aws_dynamodb_table.auth_tokens.arn,
    ]
  }

  statement {
    actions = [
      "secretsmanager:GetSecretValue",
    ]
    resources = [
      data.aws_secretsmanager_secret.feefo_api_secret.arn
    ]
  }

  statement {
    actions = [
      "kms:Decrypt"
    ]
    resources = [
      data.aws_kms_key.secrets_manager.arn
    ]
  }
}
