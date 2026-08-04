variable "environment_name" {
  type = string
}

variable "region" {
  type = string
}

variable "lambda_deployment_package_bucket" {
  type = string
}

variable "lambda_deployment_package_key" {
  type = string
}

variable "memory_size" {
  type = number
}

variable "timeout" {
  type = number
}

variable "retry_count" {
  type = string
}

variable "infra_alerts_topic" {
  type = string
}

variable "dynamo_db_deletion_protection_enabled" {
  type = bool
}

variable "tags" {
  type = object({
    application      = string
    cost_centre      = string
    environment_type = string
    gdpr_compliance  = string
    nis_d_compliance = string
    pci_compliance   = string
    support_team     = string
  })
}

# Environment variables
variable "lambda_env" {
  type = object({
    regions_file_path = string
    weather_file_path = string
  })
}
