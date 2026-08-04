resource "aws_cloudwatch_log_data_protection_policy" "lambda_function_data_protection_policy" {
  log_group_name = aws_cloudwatch_log_group.cloudwatch_log_group.name

  policy_document = jsonencode({
    Name    = "data-protection-policy"
    Version = "2021-06-01"

    Statement = [
      {
        Sid = "audit-policy"
        DataIdentifier : [
          "arn:aws:dataprotection::aws:data-identifier/EmailAddress"
        ],
        Operation = {
          Audit = {
            FindingsDestination = {}
          }
        }
      },
      {
        Sid = "redact-policy"
        DataIdentifier : [
          "arn:aws:dataprotection::aws:data-identifier/EmailAddress"
        ],
        Operation = {
          Deidentify = {
            MaskConfig = {}
          }
        }
      }
    ]
  })
}
