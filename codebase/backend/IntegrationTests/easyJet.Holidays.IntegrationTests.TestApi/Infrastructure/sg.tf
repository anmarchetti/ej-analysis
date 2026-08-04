# SG of the ALB, to which ECS service will be attached
data "aws_security_group" "alb" {
  name = "${lower(data.aws_lb.load_balancer.name)}-lb"
}

locals {
  ecs_service_sg_name = "web-${lower(var.environment_name)}-${local.project_name}"
}

resource "aws_security_group" "ecs_service" {
  name   = local.ecs_service_sg_name
  vpc_id = module.global_resources.vpc_id

  tags = {
    Name = local.ecs_service_sg_name
  }
}

resource "aws_vpc_security_group_ingress_rule" "allow_alb_traffic" {
  security_group_id = aws_security_group.ecs_service.id

  referenced_security_group_id = data.aws_security_group.alb.id
  from_port                    = 8080
  to_port                      = 8080
  ip_protocol                  = "tcp"
}

resource "aws_vpc_security_group_egress_rule" "allow_all_outbound" {
  security_group_id = aws_security_group.ecs_service.id

  ip_protocol = "-1"
  cidr_ipv4   = "0.0.0.0/0"
}

data "aws_security_group" "orchestrator_alb" {
  name = lower(
    contains(["Web-PreprodB", "Web-PreprodG"], var.environment_name)
    ? "web-preprod-lb"
    : data.aws_security_group.alb.name
  )
}

resource "aws_vpc_security_group_ingress_rule" "allow_alb_traffic_from_integration_tests_api" {
  security_group_id            = data.aws_security_group.orchestrator_alb.id
  description                  = "Traffic from Integration-test-api ECS service to Orchestrator API"
  referenced_security_group_id = aws_security_group.ecs_service.id
  from_port                    = 443
  to_port                      = 443
  ip_protocol                  = "tcp"
}
