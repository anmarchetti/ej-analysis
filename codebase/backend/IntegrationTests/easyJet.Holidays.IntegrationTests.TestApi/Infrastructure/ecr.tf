data "aws_ecr_repository" "this" {
  name = "web-integration-test-api"
}

data "aws_ecr_image" "this" {
  repository_name = data.aws_ecr_repository.this.name
  image_tag       = var.ecs_image_tag
}
