variable "name" {
  description = "Name of the lambda function"
  type        = string
}

variable "deployment_package_bucket_name" {
  type = string
}

variable "deployment_package_bucket_key" {
  type = string
}

variable "subnet_ids" {
  type = list(string)
}

variable "security_group_id" {
  type = string
}

variable "memory_size" {
  type = number
}

variable "timeout" {
  type = number
}

variable "environment_variables" {
  type = map(string)
}

variable "queue_name" {
  description = "Name of the SQS queue, which is triggering lambda function"
  type        = string
}

variable "sqs_trigger_config" {
  description = "Configuration of the SQS trigger for lambda function"
  type = object({
    enabled         = bool
    max_concurrency = number
    batch_size      = number
  })
}

variable "sns_topic_arn" {
  description = "ARN of the SNS topic to which lambda function will publish transformed booking update event"
  type        = string
}

variable "logs_table_name" {
  description = "Name of the dynamo db table for storing logs of the lambda failures"
  type        = string
}
