using easyJet.Holidays.External.AWS.Domain.Models;
using System.Diagnostics.CodeAnalysis;

namespace easyJet.Holidays.External.AWS.SalesforceSync.Settings
{
    /// <summary>
    /// Represents configuration settings for the BookingSalesforce Lambda function.
    /// </summary>
    [ExcludeFromCodeCoverage]
    public class LambdaSettings : BaseLambdaSettings
    {
        /// <summary>
        /// Gets or sets the name of the DynamoDB table used for logging failures.
        /// </summary>
        public string LogTableName { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the AWS Secrets Manager service URL for retrieving Salesforce private key.
        /// </summary>
        public string AwsSecretManagerService { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the key identifier in Secrets Manager for the Salesforce private key.
        /// </summary>
        public string PrivateKeySecretKey { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets a value indicating whether messages with the "replay" attribute should be processed.
        /// When <c>true</c>, all messages are processed. When <c>false</c>, replay messages are skipped.
        /// </summary>
        public bool ProcessReplayMessages { get; set; } = true;
    }
}