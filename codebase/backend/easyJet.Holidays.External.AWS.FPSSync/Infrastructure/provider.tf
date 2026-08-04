provider "aws" {
  region = var.region

  default_tags {
    tags = {
      # Mandatory tags for all resources
      Application      = var.tags.application
      CostCentre       = var.tags.cost_centre
      EnvironmentType  = var.tags.environment_type
      EnvironmentUse   = var.environment_name
      GDPR_Compliance  = "N"
      NIS-D_Compliance = "N"
      PCI_Compliance   = "N"
      Role             = "Lambda-FpsSync"
      SupportTeam      = var.tags.support_team
    }
  }

  ignore_tags {
    keys = [
      "map-migrated",
      "Version",
    ]
  }
}
