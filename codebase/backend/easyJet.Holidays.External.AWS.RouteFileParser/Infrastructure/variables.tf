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

variable "trigger_enabled" {
  type = string
}

variable "infra_alerts_topic" {
  type = string
}

variable "s3_access_logging_bucket" {
  type = string
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
    morning_flight_time = string
    settings_url        = string
  })
}
