data "aws_security_group" "lambda" {
  name = lower("web-${var.environment_name}-lambda")
}
