module "global_resources" {
  source = "https://artifactory.easyjet.com/artifactory/ejh-terraform-modules/nlz-global-resources/1.2.0.zip"
}

locals {
  project_name = "integration-tests-api"
}

data "aws_caller_identity" "current" {
}
