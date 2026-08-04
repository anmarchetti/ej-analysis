# Web - RouteFileParser lambda

This lambda is used to parse content of the routes file and load it into dynamo db tables.

## NLZ
### Running locally

Running locally (example for `ejh-web-dev`):

1. Review `.config.local.tfbackend` file. Make sure that you have AWS CLI profile with name mentioned there.
2. Initialize terraform:
    ```
    just init
    ```
3. Select workspace:
    ```
    just workspace
    ```
4. Plan changes:
    ```
    just plan
    ```
5. Apply changes:
    ```
    just apply
    ```


## OLZ
### Running locally (Non-Prod)

Initialize working dir: `terraform init -backend-config="profile=default" -backend-config="bucket=easyjet-holidays-terraform-remote-state" -backend-config="region=eu-west-1"`

Select workspace: `terraform workspace select Lambda-Web-RouteFileParser-CI`

Run plan: `terraform plan -var-file vars/variables.local.tfvars`

Run apply: `terraform apply -var-file vars/variables.local.tfvars`
