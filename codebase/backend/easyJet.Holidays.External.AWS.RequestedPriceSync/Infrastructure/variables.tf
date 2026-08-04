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

# External dependencies
variable "requested_price_queue_name" {
  type = string
}

variable "tourist_tax_bucket_name" {
  type        = string
  description = "tourist_tax S3 bucket name"
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
    atcom_request_timeout       = string
    atcom_room_systems_settings = string
    atcom_search_ch_base_url    = string
    atcom_search_de_base_url    = string
    atcom_search_fr_base_url    = string
    atcom_search_host           = string
    atcom_search_uk_base_url    = string
    cms_host                    = string
    default_language            = string
    duplication_board_suffix    = string
    log_level                   = string
    market_brands               = string
    market_languages            = string
    market_master_language_map  = string
    parallelization_limit       = string
    search_query_template       = string
  })
}
