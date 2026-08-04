provider "aws" {
  region = var.region

  default_tags {
    tags = {
      # Mandatory tags for all resources
      Application      = var.tags.application
      CostCentre       = var.tags.cost_centre
      EnvironmentType  = var.tags.environment_type
      EnvironmentUse   = var.environment_name
      GDPR_Compliance  = var.tags.gdpr_compliance
      NIS-D_Compliance = var.tags.nis_d_compliance
      PCI_Compliance   = var.tags.pci_compliance
      Role             = "Lambda-ImportWeatherData"
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
