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

variable "input_markets" {
  type = string
}

# Environment variables
variable "lambda_env" {
  type = object({
    atcom_ch_base_search_url    = string
    atcom_de_base_search_url    = string
    atcom_fr_base_search_url    = string
    atcom_request_timeout       = string
    atcom_search_host           = string
    atcom_search_query_template = string
    atcom_uk_base_search_url    = string
    cms_api_get_luggage         = string
    cms_host                    = string
    default_language            = string
    duplication_board_suffix    = string
    get_all_hotel_codes_url     = string
    log_level                   = string
    market_brands               = string
    market_languages            = string
    market_master_language_map  = string
    system_priorities           = string
  })
}

# External dependencies
variable "tourist_tax_bucket_name" {
  type        = string
  description = "Name of the tourist tax S3 bucket"
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
