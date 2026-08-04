# Holidays Website - Sitecore

This project contains Sitecore customizations and content for the Holidays Website.

## Running locally

Sitecore connects to AWS to retrieve secrets from AWS Secrets manager.
So, you'll need to setup AWS CLI as per instructions from [orchestrator](../orchestrator/README.md).

Once setup for Orchestrator is completed, please:

1. Add environment variable `AWS_PROFILE` = `ejh-web-dev` for your user account
2. Reboot PC
