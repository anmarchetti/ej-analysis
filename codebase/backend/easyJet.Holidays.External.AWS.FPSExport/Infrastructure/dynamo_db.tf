data "aws_dynamodb_table" "fps_dynamodb" {
  name = var.fps_dynamo_db_table
}
