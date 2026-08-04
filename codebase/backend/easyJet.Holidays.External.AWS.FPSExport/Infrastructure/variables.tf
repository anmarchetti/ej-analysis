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
  type = bool
}

variable "infra_alerts_topic" {
  type = string
}

variable "daily_cron_schedule" {
  type = string
}

variable "delta_cron_schedule" {
  type = string
}

# External dependencies
variable "fps_dynamo_db_table" {
  type = string
}

variable "fps_export_queue" {
  type = string
}

# Environment variables
variable "lambda_env" {
  type = object({
    currencies                = string
    ignore_departure_airports = string
    ignore_departure_date_to  = string
    phase_one_enabled         = string
    availability_threshold    = string
  })
}

variable "tags" {
  type = object({
    application      = string
    cost_centre      = string
    environment_type = string
    support_team     = string
  })
}
