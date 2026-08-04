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

variable "cron_schedule" {
  type = string
}

variable "sqs_visibility_timeout_minutes" {
  type = string
}

variable "sqs_retention_days" {
  type = string
}

variable "sqs_dlq_max_receive_count" {
  type = string
}

variable "sqs_dlq_retention_days" {
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
    cms_host                = string
    eskel_secret_name       = string
    eskel_timeout           = string
    feefo_secret_name       = string
    marketing_secret_name   = string
    unsubscribe_link        = string
    verbose_log_enabled     = string
    website_agent_codes     = string
  })
}
