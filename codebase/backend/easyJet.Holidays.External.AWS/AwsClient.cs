using Amazon;
using Amazon.DynamoDBv2;
using Amazon.S3;
using Amazon.SecurityToken;
using Amazon.SimpleEmailV2;
using Amazon.SimpleNotificationService;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.AWS.Logging.Interfaces;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.AWS
{
    /// <summary>
    /// AWS service functions
    /// </summary>
    public class AwsClient
    {
        private readonly AwsSettings _awsSettings;
        private readonly IDynamoDbLogger _dynamoDbLogger;

        /// <summary>
        /// For testing
        /// </summary>
        public AwsClient() { }

        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="awsSettings"></param>
        public AwsClient(IOptions<AwsSettings> awsSettings)
        {
            _awsSettings = awsSettings?.Value ?? throw new ArgumentNullException(nameof(awsSettings));
        }

        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="awsSettings"></param>
        /// <param name="dynamoDbLogger"></param>
        public AwsClient(IOptions<AwsSettings> awsSettings, IDynamoDbLogger dynamoDbLogger)
        {
            _awsSettings = awsSettings?.Value ?? throw new ArgumentNullException(nameof(awsSettings));
            _dynamoDbLogger = dynamoDbLogger;
        }

        /// <summary>
        /// Get instance of <see cref="IAmazonDynamoDB"/>.
        /// </summary>
        /// <returns>Client</returns>
        public virtual IAmazonDynamoDB GetClient()
        {
            var clientConfig = new AmazonDynamoDBConfig
            {
                RegionEndpoint = RegionEndpoint.GetBySystemName(_awsSettings.Storage.Client.Region),

            };

            if (_awsSettings.ServiceURL != null)
            {
                // now are using for tests only.
                clientConfig.AuthenticationRegion = _awsSettings.Storage.Client.Region;
                clientConfig.ServiceURL = _awsSettings.ServiceURL;
                //clientConfig.UseHttp = true;
            }

            var client = new AmazonDynamoDBClient(clientConfig);

            return client;
        }

        /// <summary>
        /// Get instance of <see cref="IAmazonDynamoDB"/> with logging enabled.
        /// </summary>
        /// <returns>Client with logging</returns>
        public virtual IAmazonDynamoDB GetDynamoDbClientWithLogging()
        {
            var clientConfig = new AmazonDynamoDBConfig
            {
                RegionEndpoint = RegionEndpoint.GetBySystemName(_awsSettings.Storage.Client.Region),

            };

            if (_awsSettings.ServiceURL != null)
            {
                clientConfig.AuthenticationRegion = _awsSettings.Storage.Client.Region;
                clientConfig.ServiceURL = _awsSettings.ServiceURL;
            }

            var client = new AmazonDynamoDBClient(clientConfig);

            client.AfterResponseEvent += _dynamoDbLogger.LoggingResponseEventHandler;

            return client;
        }

        /// <summary>
        /// Get instance of <see cref="AmazonS3Client"/>.
        /// </summary>
        /// <returns>Client</returns>
        public virtual AmazonS3Client GetS3Client()
        {
            var config = new AmazonS3Config()
            {
                RegionEndpoint = RegionEndpoint.GetBySystemName(_awsSettings.S3.Client.Region)
            };

            if (_awsSettings.S3.Client.ServiceUrl != null)
            {
                config.ServiceURL = _awsSettings.S3.Client.ServiceUrl;
            }

            return new AmazonS3Client(config);
        }

        /// <summary>
        /// Get Simple Notification Service client
        /// </summary>
        /// <returns></returns>
        public virtual AmazonSimpleNotificationServiceClient GetSNSClient()
        {
            var config = new AmazonSimpleNotificationServiceConfig
            {
                ServiceURL = _awsSettings.SNS.Client.ServiceUrl,
                AuthenticationRegion = _awsSettings.SNS.Client.Region
            };

            return new AmazonSimpleNotificationServiceClient(config);
        }
        
        /// <summary>
        /// Get security token client without credentials.
        /// </summary>
        /// <param name="region">region</param>
        /// <returns>Security token service.</returns>
        public virtual IAmazonSecurityTokenService GetSTSClient(string region)
        {
            var clientConfig = new AmazonSecurityTokenServiceConfig
            {
                RegionEndpoint = RegionEndpoint.GetBySystemName(region),
            };

            return new AmazonSecurityTokenServiceClient(clientConfig);
        }

        /// <summary>
        /// Get Simple Email Service client
        /// </summary>
        /// <returns></returns>
        public virtual AmazonSimpleEmailServiceV2Client GetSESClient()
        {
            var config = new AmazonSimpleEmailServiceV2Config
            {
                RegionEndpoint = RegionEndpoint.GetBySystemName(_awsSettings.SES.Client.Region)
            };

            if (!string.IsNullOrEmpty(_awsSettings.SES.Client.ServiceUrl))
            {
                config.ServiceURL = _awsSettings.SES.Client.ServiceUrl;
            }

            return new AmazonSimpleEmailServiceV2Client(config);
        }

        /// <summary>
        /// Client without credentials. Should be used for e.g. lambdas
        /// </summary>
        /// <returns></returns>
        public static IAmazonDynamoDB GetImplicitClient(string region)
        {
            var clientConfig = new AmazonDynamoDBConfig
            {
                RegionEndpoint = RegionEndpoint.GetBySystemName(region),
            };

            return new AmazonDynamoDBClient(clientConfig);
        }
    }
}
