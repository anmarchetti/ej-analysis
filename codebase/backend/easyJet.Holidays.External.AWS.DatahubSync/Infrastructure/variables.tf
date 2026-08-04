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

variable "trigger_config" {
  type = object({
    enabled         = bool
    batch_size      = number
    max_concurrency = number
  })
}

variable "replay_trigger_config" {
  type = object({
    enabled         = bool
    batch_size      = number
    max_concurrency = number
  })
}

variable "sns_delivery_status_logging_role" {
  type = string
}

variable "sns_topic_allowed_subscriber_arns" {
  type = string
}

# External dependencies
variable "atcom_booking_change_events_queue" {
  type = string
}

variable "operational_alerts_subscriber_emails" {
  description = "Comma separated list of email addresses to be subscribed to the operational alerts (non-ITSD facing)"
  type        = string
}

variable "operational_alerts_dlq_messages_threshold" {
  description = "Threshold for DLQ alert to be sent to the ops team (excluding ITSD)"
  type        = number
}

variable "itsd_alerts_subscriber_emails" {
  description = "Comma separated list of email addresses to be subscribed to the ITSD alerts"
  type        = string
}

variable "itsd_alerts_dlq_messages_threshold" {
  description = "Threshold for DLQ alert to be sent to the ITSD team"
  type        = number
}

# Environment variables
variable "lambda_env" {
  type = object({
    allowed_prefix                  = string
    atcom_booking_base_url          = string
    atcom_booking_host              = string
    atcom_datahub_base_url          = string
    atcom_datahub_host              = string
    atcom_user_code                 = string
    atcom_vrp_error_codes_to_ignore = string
    atcom_vrp_ignore_all_errors     = string
    cms_host                        = string
    compression_threshold           = number
    delay                           = string
    enable_vrp_call                 = bool
    log_level                       = string
    use_verbose_http_logging        = bool
  })
}

variable "replay_lambda_env" {
  type = object({
    allowed_prefix                  = string
    atcom_booking_base_url          = string
    atcom_booking_host              = string
    atcom_datahub_base_url          = string
    atcom_datahub_host              = string
    atcom_user_code                 = string
    atcom_vrp_error_codes_to_ignore = string
    atcom_vrp_ignore_all_errors     = string
    cms_host                        = string
    compression_threshold           = number
    delay                           = string
    enable_vrp_call                 = bool
    log_level                       = string
    use_verbose_http_logging        = bool
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
