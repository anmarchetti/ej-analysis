environment_name  = "#{Web.EnvironmentName}"
region            = "#{Aws.Region}"
elb_rule_priority = "#{Aws.Elb.RulePriority}"
is_blue_green_env = "#{Web.IsBlueGreenEnvironment}"

# ECS
ecs_image_tag = "#{Octopus.Release.Number}"
web_api_url   = "#{EcsTask.Env.WebApiUrl}"
