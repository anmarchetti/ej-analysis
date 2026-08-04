variable "region" {
  type = string
}

variable "environment_name" {
  type = string
}

variable "lambda_deployment_package_bucket" {
  type = string
}

variable "lambda_deployment_package_key" {
  type = string
}

variable "memory_size" {
  type = string
}

variable "timeout" {
  type = string
}

variable "retry_count" {
  type = string
}

variable "trigger_enabled" {
  type = bool
}

variable "infra_alerts_topic" {
  type = string
}

variable "secrets_manager_kms_key_id" {
  type = string
}

variable "hotel_content_bucket_name" {
  type = string
}

variable "hotel_content_bucket_allowed_cors_origins" {
  type = string
}

# External dependencies
variable "salesforce_iam_user_arn" {
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
