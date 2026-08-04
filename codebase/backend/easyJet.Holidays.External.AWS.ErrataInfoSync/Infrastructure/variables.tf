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

variable "cron_schedule" {
  type = string
}

variable "infra_alerts_topic" {
  type = string
}

variable "secrets_manager_kms_key_id" {
  type = string
}

# Environment variables
variable "lambda_env" {
  type = object({
    aws_secrets_manager_service_url = string
    atcom_db_secret_name            = string
    language_map                    = string
    cms_host                        = string
    fail_when_no_flight_errata      = string
  })
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
