AWS Lambda Function
This AWS Lambda function written in C# performs various tasks related to processing booking information and integrating with the Salesforce system. It consists of two main components: the Booking Extractor Lambda function and the Salesforce Lambda function.

Booking Extractor Lambda Function
The Booking Extractor Lambda function is responsible for extracting booking information and triggering the integration flow. It performs the following tasks:

Extracts booking information from the source system.
Sends the extracted booking information to an SNS topic for further processing.
Salesforce Lambda Function
The Salesforce Lambda function is triggered by the SNS topic and handles the integration with the Salesforce system. It performs the following tasks:

Receives the booking information from the SNS topic via an SQS queue.
Processes the received booking information and performs any necessary transformations.
Sends the processed booking information to the Salesforce system.

Environment Variables
This Lambda function can be configured using the following environment variables:

Username: [Description of the username]
ClientId: [Description of the client ID]
LoginUrl: [Description of the login URL]
FlowApiName: [Description of the Flow API name]
BaseUrl: [Description of the base URL]
ErrorCodesToIgnore: [Description of the error codes to ignore, separated by commas]
PrivateKeySecretName: [Description of the secret name for the private key in AWS Secrets Manager]
PrivateKeySecretKey: [Description of the secret key for the private key in AWS Secrets Manager]
AwsSecretManagerServiceUrl: [Description of the AWS Secrets Manager service URL]
LogTableName: [Description of the log table name]
CMSHost: [Description of the CMS host]
GetAllSpecialRequests: [Description of the environment variable for getting all special requests]
Please ensure to set these variables according to your specific requirements before deploying the function.

Architecture Diagram
The following diagram illustrates the high-level architecture of the system:
         +-----------------+
         |  Booking        |
         |  Extractor      |
         |  Lambda         |
         +-----------------+
                  |
         +-----------------+
         |  SNS Topic      |
         +-----------------+
                  |
         +-----------------+
         |  SQS            |
         +-----------------+
                  |
         +-----------------+
         |  Salesforce     |
         |  Lambda         |
         +-----------------+
                  |
         +-----------------+
         |  Salesforce     |
         |  System         |
         +-----------------+
The flow of the system is as follows:

The Booking Extractor Lambda function extracts booking information.
The extracted booking information is sent to an SNS topic.
The SNS topic publishes the message to an SQS queue.
The Salesforce Lambda function is triggered by the SQS queue.
The Salesforce Lambda function processes the message and sends it to the Salesforce system.
Please note that the architecture diagram and the flow can be customized based on your specific requirements.

Feel free to modify and extend this README file to provide more detailed instructions or any additional information relevant to your specific AWS Lambda function and project.