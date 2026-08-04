data "aws_ecs_cluster" "esc_cluster" {
  cluster_name = lower("web-${var.environment_name}")
}

resource "aws_ecs_service" "ecs_service" {
  name            = "web-${local.project_name}"
  cluster         = data.aws_ecs_cluster.esc_cluster.arn
  task_definition = aws_ecs_task_definition.integration_tests_api.arn
  desired_count   = 1

  capacity_provider_strategy {
    capacity_provider = "FARGATE_SPOT"
    weight            = 1
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.integration_tests_api.arn
    container_name   = local.project_name
    container_port   = 8080
  }

  network_configuration {
    subnets          = module.global_resources.private_subnet_ids
    assign_public_ip = false
    security_groups = [
      aws_security_group.ecs_service.id,
    ]
  }
}

resource "aws_ecs_task_definition" "integration_tests_api" {
  family                   = "integration-test-api"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 512
  memory                   = 1024
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name      = local.project_name
      image     = "${data.aws_ecr_repository.this.repository_url}:${data.aws_ecr_image.this.image_tag}"
      essential = true
      memory    = 1024
      cpu       = 512
      portMappings = [
        {
          containerPort = 8080
          protocol      = "tcp"
        }
      ]
      logConfiguration = {
        logDriver = "awslogs",
        options = {
          awslogs-group         = aws_cloudwatch_log_group.ecs_service.name
          awslogs-region        = var.region
          awslogs-stream-prefix = "${lower(var.environment_name)}-${local.project_name}"
        }
      }
      environment = [
        {
          name  = "WebApiUrl",
          value = "${var.web_api_url}"
        }
      ]
      secrets = [
        {
          name      = "SharedServices__Key",
          valueFrom = "${data.aws_secretsmanager_secret.orchestrator.arn}:SharedServices__Key::"
        }
      ]
    }
  ])
}
