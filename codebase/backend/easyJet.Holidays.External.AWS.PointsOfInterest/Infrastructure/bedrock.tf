data "aws_bedrock_foundation_model" "bedrock_foundation_model" {
  model_id = var.bedrock_client_model_id
}

data "aws_bedrock_inference_profile" "bedrock_inference_profile" {
  region               = var.region
  inference_profile_id = "eu.${var.bedrock_client_model_id}"
}
