using Amazon.DynamoDBv2.Model;
using Amazon.Runtime;
using easyJet.Holidays.External.AWS.Logging.Interfaces;
using Microsoft.Extensions.Logging;
using System.Globalization;
using System.Text;

namespace easyJet.Holidays.External.AWS.Logging
{
    /// <summary>
    /// Logger for handling and logging DynamoDB response events.
    /// </summary>
    public class DynamoDbLogger : IDynamoDbLogger
    {
        private const string UnknownTableLogMessage = "Unknown table";
        private const string CanNotParseResponseLogMessage = "Can not parse response message";

        private readonly ILogger<DynamoDbLogger> _logger;

        /// <summary>
        /// Initializes a new instance of the <see cref="DynamoDbLogger"/> class.
        /// </summary>
        /// <param name="logger">The logger instance to use for logging.</param>
        public DynamoDbLogger(ILogger<DynamoDbLogger> logger)
        {
            _logger = logger;
        }

        /// <summary>
        /// Handles the logging of response events from DynamoDB.
        /// </summary>
        /// <param name="sender">The source of the event.</param>
        /// <param name="e">The event data containing the response details.</param>
        public void LoggingResponseEventHandler(object sender, ResponseEventArgs e)
        {
            var responseEvent = e as WebServiceResponseEventArgs;
            var tableName = GetTableName(responseEvent?.Request);
            var responseMessage = GetResponseMessage(responseEvent?.Response);

            _logger.LogTrace("Amazon DynamoDb client.\nExternal call to {TableName} was successful.\n{ResponseMessage}", tableName, responseMessage);
        }

        /// <summary>
        /// Gets the table name from the request.
        /// </summary>
        /// <param name="request">The Amazon web service request.</param>
        /// <returns>The table name if available; otherwise, "Unknown table".</returns>
        private static string GetTableName(AmazonWebServiceRequest request) => request switch
        {
            GetItemRequest getItemRequest => getItemRequest.TableName,
            _ => UnknownTableLogMessage
        };

        /// <summary>
        /// Gets the response message from the response.
        /// </summary>
        /// <param name="response">The Amazon web service response.</param>
        /// <returns>The response message if available; otherwise, "Can not parse response message".</returns>
        private static string GetResponseMessage(AmazonWebServiceResponse response) => response switch
        {
            GetItemResponse getItemResponse => GetResponseMessage(getItemResponse),
            null => CanNotParseResponseLogMessage,
            _ => CanNotParseResponseLogMessage
        };

        /// <summary>
        /// Gets the response message from the GetItemResponse.
        /// </summary>
        /// <param name="response">The GetItemResponse instance.</param>
        /// <returns>A formatted string containing the response details.</returns>
        private static string GetResponseMessage(GetItemResponse response)
        {
            var sb = new StringBuilder();
            var culture = CultureInfo.InvariantCulture;
            sb.AppendLine(culture, $"HttpStatusCode > {response.HttpStatusCode}");
            foreach (var attributeValue in response.Item)
            {
                sb.AppendLine(culture, $"{attributeValue.Key} > {attributeValue.Value.S}");
            }
            return sb.ToString();
        }
    }
}