# This role is needed for Salesforce integration, which exists only in production and references production user
resource "aws_iam_role" "salesforce" {
  count = var.salesforce_iam_user_arn != "" ? 1 : 0

  name        = "HolidaysSalesforceHotelContent"
  description = "Role for Salesforce to allow read and write to ejh-hotel-content objects for the hotelier portal"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow",
        Principal = {
          AWS = var.salesforce_iam_user_arn
        }
      },
    ]
  })
}

resource "aws_iam_role_policy_attachment" "salesforce_hotel_content_access" {
  count = var.salesforce_iam_user_arn != "" ? 1 : 0

  role       = aws_iam_role.salesforce[0].name
  policy_arn = aws_iam_policy.salesforce_hotel_content_access[0].arn
}

resource "aws_iam_policy" "salesforce_hotel_content_access" {
  count = var.salesforce_iam_user_arn != "" ? 1 : 0

  name = "HolidaysSalesforceHotelContentAccess"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.hotel_content.arn,
          "${aws_s3_bucket.hotel_content.arn}/*"
        ]
      },
    ]
  })
}
