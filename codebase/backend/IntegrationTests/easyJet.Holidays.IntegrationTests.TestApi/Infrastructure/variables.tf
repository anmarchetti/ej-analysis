variable "environment_name" {
  type = string
}

variable "region" {
  type = string
}

variable "elb_rule_priority" {
  type = string
}

variable "is_blue_green_env" {
  type    = bool
  default = false
}

# ECS
variable "ecs_image_tag" {
  type = string
}

variable "web_api_url" {
  type = string
}
