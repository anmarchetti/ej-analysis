provider "aws" {
  region = var.region

  default_tags {
    tags = {
      # Mandatory tags for all resources
      Application      = "easyjet holidays Website AS"
      CostCentre       = "44000"
      EnvironmentUse   = var.environment_name
      EnvironmentType  = "Dev"
      GDPR_Compliance  = "N"
      NIS-D_Compliance = "N"
      PCI_Compliance   = "N"
      SupportTeam      = "Holidays.DevOps@easyjet.com"

      # Custom tags
      Role = "Web-Integration-Test-Api"
    }
  }

  ignore_tags {
    keys = ["map-migrated"]
  }
}
