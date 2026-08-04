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

variable "trigger_enabled" {
  type = string
}

variable "sqs_trigger_batch_size" {
  type = string
}

variable "sqs_trigger_max_concurrency" {
  type = string
}

# External dependencies
variable "auth_tokens_table_name" {
  type = string
}

variable "feefo_queue_name" {
  type = string
}

variable "secrets_manager_kms_key_id" {
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
    api_verbose_log_enabled = string
    delay                   = string
    sample_rate             = string
    feefo_secret_name       = string
    csat_url                = string
  })
}
