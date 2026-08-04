using Amazon.Runtime;

namespace easyJet.Holidays.External.AWS.Logging.Interfaces
{
    /// <summary>
    /// Interface for logging events related to DynamoDB responses.
    /// </summary>
    public interface IDynamoDbLogger
    {
        /// <summary>
        /// Handles the logging of response events from DynamoDB.
        /// </summary>
        /// <param name="sender">The source of the event.</param>
        /// <param name="e">The event data containing the response details.</param>
        void LoggingResponseEventHandler(object sender, ResponseEventArgs e);
    }
}