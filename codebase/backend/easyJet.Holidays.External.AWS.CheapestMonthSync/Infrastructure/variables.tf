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

variable "sqs_trigger_max_concurrency" {
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
    api_timeout_milli_seconds   = string
    atcom_booking_base_url      = string
    atcom_booking_host          = string
    atcom_search_ch_base_url    = string
    atcom_search_ch_host        = string
    atcom_search_de_base_url    = string
    atcom_search_de_host        = string
    atcom_search_fr_base_url    = string
    atcom_search_fr_host        = string
    atcom_search_uk_base_url    = string
    atcom_search_uk_host        = string
    b2b_url                     = string
    cms_host                    = string
    is_last_available_filter_on = string
    log_level                   = string
    promo_page_id               = string
  })
}
