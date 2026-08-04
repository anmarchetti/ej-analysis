locals {
  lambda_function_sg_name = lower("fps-sync-lambda-${var.environment_name}")
}

resource "aws_security_group" "lambda_function" {
  name   = local.lambda_function_sg_name
  vpc_id = module.global_resources.vpc_id

  tags = {
    Name = local.lambda_function_sg_name
  }
}

resource "aws_vpc_security_group_egress_rule" "lambda_function_allow_all_outbound" {
  security_group_id = aws_security_group.lambda_function.id

  cidr_ipv4   = "0.0.0.0/0"
  ip_protocol = -1
}