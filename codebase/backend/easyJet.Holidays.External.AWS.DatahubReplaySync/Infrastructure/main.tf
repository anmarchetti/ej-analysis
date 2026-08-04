data "aws_caller_identity" "current" {
}

module "global_resources" {
  source = "https://artifactory.easyjet.com/artifactory/ejh-terraform-modules/nlz-global-resources/1.0.0.zip"
}
