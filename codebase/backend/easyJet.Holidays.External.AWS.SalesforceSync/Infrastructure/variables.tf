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

variable "sqs_trigger_batch_size" {
  type = string
}

variable "sqs_trigger_max_concurrency" {
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

variable "operational_alerts_subscriber_emails" {
  description = "Comma separated list of email addresses to be subscribed to the operational alerts (non-ITSD facing)"
  type        = string
}

variable "itsd_alerts_subscriber_emails" {
  description = "Comma separated list of email addresses to be subscribed to the ITSD alerts"
  type        = string
}

# External dependencies
variable "extracted_atcom_events_topic_arns" {
  type = string
}

# Environment variables
variable "lambda_env" {
  type = object({
    aws_secrets_manager_service_url = string
    base_url                        = string
    client_id                       = string
    error_codes_to_ignore           = string
    log_level                       = string
    login_url                       = string
    send_data_enabled               = bool
    process_replay_messages         = bool
    use_verbose_http_logging        = string
    username                        = string
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
