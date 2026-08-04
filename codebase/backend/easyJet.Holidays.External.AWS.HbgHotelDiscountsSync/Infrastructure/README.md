# Global - HBGHotelDiscountsSync lambda

This Lambda function synchronizes promotional "Hbg hotel discounts" data from the Eskel system into an AWS DynamoDB. It involves fetching the data from Eskel API, transforming it according to the required schema, and updating the DynamoDB table to reflect the latest promotions available for hotel stays. WebAPI reads the prepared structured data from AWS DynamoDB and enriches the responses from Atcom with information about offer discounts.

![AWS Resources](./infrastructure.png)

## Running locally

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
