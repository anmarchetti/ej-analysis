resource "aws_cloudwatch_log_group" "ecs_service" {
  name              = lower("/ejh/ecs/${data.aws_ecs_cluster.esc_cluster.cluster_name}/web-${local.project_name}")
  retention_in_days = 7
}
