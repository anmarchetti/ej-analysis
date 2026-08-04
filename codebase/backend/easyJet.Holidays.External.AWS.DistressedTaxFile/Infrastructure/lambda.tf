locals {
  lambda_function_name = "Holidays-DistressedFileSync-${var.environment_name}"
}

resource "aws_lambda_function" "lambda_function" {
  function_name = local.lambda_function_name
  role          = aws_iam_role.lambda_function.arn
  handler       = "DistressedTaxFile::easyJet.Holidays.External.AWS.DistressedTaxFile.Function_Run_Generated::Run"
  runtime       = "dotnet10"
  memory_size   = var.memory_size
  timeout       = var.timeout

  s3_bucket         = data.aws_s3_object.lambda_function_package.bucket
  s3_key            = data.aws_s3_object.lambda_function_package.key
  s3_object_version = data.aws_s3_object.lambda_function_package.version_id

  lifecycle {
    ignore_changes = [s3_key, s3_object_version] # Don't update code automatically after creation of the function
  }

  environment {
    variables = {
      AWS_LAMBDA_HANDLER_LOG_LEVEL                  = "Debug"
      LambdaSettings__DepartureAirportsChildTaxFree = var.lambda_env.departure_airports_child_tax_free
      LambdaSettings__EnableTaxCalculation          = true
      LambdaSettings__FileSizeTolerancePercentage   = var.lambda_env.file_size_tolerance_percentage
      LambdaSettings__NewFareClassPhaseOneEnabled   = var.lambda_env.phase_one_enabled
      LambdaSettings__S3BucketName                  = aws_s3_bucket.distressed_files.bucket
      LambdaSettings__S3TaxFileObjectKey            = var.lambda_env.s3_tax_file_object_key
      LambdaSettings__UploadBucketFolders           = var.lambda_env.upload_bucket_folders
      LambdaSettings__UploadBucketName              = var.lambda_env.upload_bucket_name
    }
  }

  vpc_config {
    subnet_ids         = module.global_resources.private_subnet_ids
    security_group_ids = [aws_security_group.lambda_function.id]
  }

  tags = {
    Name = local.lambda_function_name
  }
}

resource "aws_lambda_function_event_invoke_config" "lambda_function_function_invoke_config" {
  function_name          = aws_lambda_function.lambda_function.function_name
  maximum_retry_attempts = var.retry_count
}

data "aws_s3_object" "lambda_function_package" {
  bucket = var.lambda_deployment_package_bucket
  key    = var.lambda_deployment_package_key
}
