resource "aws_iam_role" "lambda_function_role" {
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
  role       = aws_iam_role.lambda_function_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

resource "aws_iam_role_policy" "lambda_function_policy" {
  name = "lambda_function_policy"
  role = aws_iam_role.lambda_function_role.id
  policy = jsonencode({
    "Version" : "2012-10-17",
    Statement = [
      {
        "Action" : [
          "dynamodb:Update*",
          "dynamodb:Scan",
          "dynamodb:Query",
          "dynamodb:Put*",
          "dynamodb:Get*",
          "dynamodb:DeleteItem",
          "dynamodb:Batch*",
          "dynamodb:DescribeTable"
        ],
        "Effect" : "Allow",
        "Resource" : [
          aws_dynamodb_table.points_of_interest.arn
        ]
      },
      {
        Action = [
          "bedrock:InvokeModel",
          "bedrock:InvokeModelWithResponseStream"
        ],
        Effect = "Allow",
        Resource = [
          "arn:aws:bedrock:*::foundation-model/${data.aws_bedrock_foundation_model.bedrock_foundation_model.model_id}",
          data.aws_bedrock_inference_profile.bedrock_inference_profile.inference_profile_arn
        ]
      }
    ]
  })
}

