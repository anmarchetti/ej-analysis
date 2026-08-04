resource "aws_iam_role" "lambda_function_role" {
  name = var.name

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
      "sqs:ReceiveMessage",
      "sqs:DeleteMessage",
      "sqs:GetQueueAttributes",
    ]
    resources = [
      aws_sqs_queue.atcom_events.arn
    ]
  }

  statement {
    actions = [
      "SNS:Publish",
    ]

    resources = [
      var.sns_topic_arn
    ]
  }

  statement {
    actions = [
      "dynamodb:*",
    ]

    resources = [
      aws_dynamodb_table.logs_table.arn
    ]
  }
}
