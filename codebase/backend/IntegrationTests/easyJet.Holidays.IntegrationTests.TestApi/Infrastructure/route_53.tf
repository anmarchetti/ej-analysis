data "aws_route53_zone" "private" {
  name         = module.global_resources.hosted_zone_name
  private_zone = true
}

# Main DNS record for the environment
resource "aws_route53_record" "internal_dns" {
  zone_id = data.aws_route53_zone.private.id
  name    = "int-tests-api-${lower(var.environment_name)}"
  type    = "CNAME"
  ttl     = 300
  records = [
    data.aws_lb.load_balancer.dns_name,
  ]
}
