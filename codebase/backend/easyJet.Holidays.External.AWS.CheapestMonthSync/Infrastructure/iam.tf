resource "aws_iam_role" "lambda_function" {
  name = "Holidays-${local.lambda_function_name}"

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

resource "aws_iam_role_policy" "lambda_function" {
  name   = "lambda_function_policy"
  role   = aws_iam_role.lambda_function.id
  policy = data.aws_iam_policy_document.lambda_function.json
}

data "aws_iam_policy_document" "lambda_function" {
  statement {
    actions = [
      "sqs:ReceiveMessage",
      "sqs:DeleteMessage",
      "sqs:GetQueueAttributes",
    ]
    resources = [
      data.aws_sqs_queue.cheapest_month_sync.arn
    ]
  }

  statement {
    actions = [
      "dynamodb:BatchGetItem",
      "dynamodb:BatchWriteItem",
      "dynamodb:PutItem",
      "dynamodb:DeleteItem",
      "dynamodb:Scan",
      "dynamodb:Query",
      "dynamodb:UpdateItem",
      "dynamodb:GetItem",
    ]

    resources = [
      aws_dynamodb_table.cheapest_month_sync.arn,
      data.aws_dynamodb_table.routes_date.arn,
      data.aws_dynamodb_table.routes_ver.arn,
    ]
  }
}
