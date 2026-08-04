# Holidays Orchestrator

This project contains API of the Holidays Website.

## Running locally

Prerequisites:

1. .NET 8 SDK must be installed
2. AWS CLI must be installed
3. Access to AWS account `ejh-web-dev` must work via AWS Identity Centre (<https://d-936762b7df.awsapps.com/start>). This is required because during startup Orchestrator fetches secrets from AWS Secrets Manager)


One-time setup:

1. Configure SSO session:
    ```
    aws configure sso
    ```
    Enter details below:
      - SSO session name: `ej`
      - SSO start URL: `https://d-936762b7df.awsapps.com/start/#`
      - SSO region: `eu-west-1`
      - SSO registration scopes: accept default value
2. Confirm in the browser that you've happy to authorize AWS CLI.
3. You will be invited to add first profile. Select `ejh-web-dev` and set `eu-west-1` as default region. Set profile name to `ejh-web-dev` (same as AWS account name).

Once you complete steps above, Orchestrator should be able to pick up temporary credentials from SSO session.

Keep in mind that these credentials last ~8 hours, so every day you'll need to run command below to re-authenticate:
```
aws sso login --sso-session ej
```

## Running in docker

Build image:
```
docker build -t ejh-web-orchestrator-local -f ./easyJet.Holidays.Api/Dockerfile .
```

Run dotnet commands inside docker container:
```
docker run --rm -it -v "$(pwd)":/app -w /app mcr.microsoft.com/dotnet/sdk:8.0
```
