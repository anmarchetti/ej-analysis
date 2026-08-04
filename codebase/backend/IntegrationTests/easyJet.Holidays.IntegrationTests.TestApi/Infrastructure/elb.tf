data "aws_lb" "load_balancer" {
  name = lower(
    var.is_blue_green_env
    ? "web-${var.environment_name}-int"
    : "web-${var.environment_name}"
  )
}

data "aws_lb_listener" "https" {
  load_balancer_arn = data.aws_lb.load_balancer.arn
  port              = 443
}

resource "aws_lb_target_group" "integration_tests_api" {
  name        = "web-${lower(var.environment_name)}-int-tests-api"
  port        = 8080
  protocol    = "HTTP"
  vpc_id      = module.global_resources.vpc_id
  target_type = "ip"

  health_check {
    interval            = 10
    path                = "/booking/health-check"
    protocol            = "HTTP"
    timeout             = 5
    healthy_threshold   = 5
    unhealthy_threshold = 2
    matcher             = 200
  }
}

resource "aws_lb_listener_rule" "integration_tests_api" {
  listener_arn = data.aws_lb_listener.https.arn
  priority     = var.elb_rule_priority

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.integration_tests_api.id
  }

  condition {
    host_header {
      values = ["int-tests-api-${lower(var.environment_name)}.*"]
    }
  }
}
