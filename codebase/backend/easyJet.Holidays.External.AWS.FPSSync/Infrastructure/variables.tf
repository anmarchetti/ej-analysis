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

variable "sqs_trigger_enabled" {
  type = bool
}

variable "infra_alerts_topic" {
  type = string
}

variable "sqs_trigger_batch_size" {
  type = number
}

variable "sqs_max_receive_count" {
  type = number
}

variable "sqs_max_concurrency" {
  type = number
}

# External dependencies
variable "event_bus_execution_role" {
  type = string
}

variable "tags" {
  type = object({
    application      = string
    cost_centre      = string
    environment_type = string
    support_team     = string
  })
}

# Environment variables
variable "lambda_env" {
  type = object({
    currencies = string
  })
}
