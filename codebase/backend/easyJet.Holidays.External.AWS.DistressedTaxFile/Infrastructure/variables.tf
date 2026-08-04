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

variable "input_file_path_prefix" {
  description = "Prefix of the files uploaded by BIL to S3 bucket"
  type        = string
}

variable "enable_fps_bucket_replication" {
  description = "Flag to enable replication to the FPS bucket for backwards compatibility with current Atcom ingestion settings. Will be removed in the future."
  type        = bool
}

# External dependencies
variable "fps_files_bucket" {
  type = string
}

# Environment variables
variable "lambda_env" {
  type = object({
    departure_airports_child_tax_free = string
    file_size_tolerance_percentage    = number
    phase_one_enabled                 = string
    s3_tax_file_object_key            = string
    upload_bucket_folders             = string
    upload_bucket_name                = string
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
