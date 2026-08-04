terraform {
  backend "s3" {
    key     = "infrastructure.tfstate"
    encrypt = "true"
  }
}
