using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using Amazon.Lambda.SQSEvents;
using easyJet.Holidays.External.AWS.Domain.Models;
using easyJet.Holidays.External.AWS.SalesforceSync.Mappers;
using easyJet.Holidays.External.AWS.SalesforceSync.Settings;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using System.Globalization;
using System.IO.Compression;
using System.Text;
using static Amazon.Lambda.SNSEvents.SNSEvent;

namespace easyJet.Holidays.External.AWS.SalesforceSync.Services;

/// <summary>
/// 
/// </summary>
public class SalesforceSyncHandler : ISalesforceSyncHandler
{
    private readonly IAmazonDynamoDB _dynamoDb;
    private readonly ISalesforceApi _salesforceApi;
    private readonly ISalesforceAuthenticator _authenticator;
    private readonly IBookingSyncTransferMapper _transferMapper;
    private readonly ILogger<SalesforceSyncHandler> _logger;
    private readonly LambdaSettings _settings;
    private static readonly JsonSerializerSettings JsonSettings = new()
    {
        DateParseHandling = DateParseHandling.None
    };

    /// <summary>
    /// 
    /// </summary>
    /// <param name="dynamoDb"></param>
    /// <param name="salesforceApi"></param>
    /// <param name="authenticator"></param>
    /// <param name="transferMapper"></param>
    /// <param name="logger"></param>
    /// <param name="options"></param>
    public SalesforceSyncHandler(
        IAmazonDynamoDB dynamoDb,
        ISalesforceApi salesforceApi,
        ISalesforceAuthenticator authenticator,
        IBookingSyncTransferMapper transferMapper,
        ILogger<SalesforceSyncHandler> logger,
        IOptions<LambdaSettings> options
    )
    {
        _dynamoDb = dynamoDb;
        _salesforceApi = salesforceApi;
        _authenticator = authenticator;
        _transferMapper = transferMapper;
        _logger = logger;

        ArgumentNullException.ThrowIfNull(options);
        _settings = options.Value;
    }

    /// <inheritdoc />
    public async Task<SQSBatchResponse> ProcessBatchAsync(IEnumerable<SQSEvent.SQSMessage>? records)
    {
        var response = new SQSBatchResponse();
        var token = await _authenticator.GetAccessTokenAsync();
        foreach (var record in records ?? throw new ArgumentNullException(nameof(records)))
        {
            var wrapper = new BookingSyncTransferWrapper();
            try
            {
                if (ShouldSkipMessage(record))
                    continue;

                wrapper = DeserializeMessage(record);
                var request = _transferMapper.MapBookingDetails(wrapper);
                await _salesforceApi.SendAsync(token, request);
            }
            catch (Exception ex)
            {
                var bookingId = wrapper.ReservationDataResponse?.Response.Data_Hub.Reservation.Res_Id;
                var version = wrapper.ReservationDataResponse?.Response.Data_Hub.Reservation.Ver_Num;
                _logger.LogError(ex, "Error processing record {MessageId}, BookingId {BookingId}, Version {Version}, Message: {Message}, Stacktrace: {Stacktrace}", record.MessageId, bookingId, version, ex.Message, ex.StackTrace);
                response.BatchItemFailures.Add(new SQSBatchResponse.BatchItemFailure { ItemIdentifier = record.MessageId });
                await LogFailureAsync(record.MessageId, bookingId!, version!, ex);
            }
        }
        return response;
    }

    /// <summary>
    /// Checks whether the message should be skipped based on the configured attribute name.
    /// </summary>
    private bool ShouldSkipMessage(SQSEvent.SQSMessage record)
    {
        if (_settings.ProcessReplayMessages)
            return false;

        var sns = JsonConvert.DeserializeObject<SNSMessage>(record.Body);
        if (sns?.MessageAttributes?.ContainsKey("replay") != true)
            return false;

        _logger.LogInformation("Skipping replay message {MessageId}", record.MessageId);
        return true;
    }

    /// <summary>
    /// Deserializes the SQS message into a BookingSyncTransferWrapper.
    /// Handles both compressed messages (with payload in message attributes) and uncompressed messages (in message body).
    /// </summary>
    /// <param name="record">Single SQS message.</param>
    /// <returns>Deserialized booking wrapper.</returns>
    /// <exception cref="ArgumentException">Thrown when the message body or SNS wrapper is invalid.</exception>
    private static BookingSyncTransferWrapper DeserializeMessage(SQSEvent.SQSMessage record)
    {
        if (string.IsNullOrWhiteSpace(record.Body))
            throw new ArgumentException("Message body is empty", nameof(record));

        var sns = JsonConvert.DeserializeObject<SNSMessage>(record.Body);
        if (sns == null)
            throw new ArgumentException("SNS message is invalid", nameof(record));

        string payloadJson;

        // Check if this is a compressed message (has GZippedPayload attribute)
        if (sns.MessageAttributes?.TryGetValue("GZippedPayload", out MessageAttribute? compressedAttribute) ?? false)
        {
            // Handle compressed payload
            if (string.IsNullOrEmpty(compressedAttribute?.Value))
                throw new ArgumentException("Compressed payload is invalid", nameof(record));

            // The binary data comes as a base64 encoded string in SNS Lambda events
            var compressedBytes = Convert.FromBase64String(compressedAttribute.Value);

            // Decompress the payload
            using var compressedStream = new MemoryStream(compressedBytes);
            using var decompressedStream = new MemoryStream();
            using (var gzipStream = new GZipStream(compressedStream, CompressionMode.Decompress))
            {
                gzipStream.CopyTo(decompressedStream);
            }

            payloadJson = Encoding.UTF8.GetString(decompressedStream.ToArray());
        }
        else
        {
            // Handle uncompressed payload (payload is directly in the SNS Message)
            if (string.IsNullOrEmpty(sns.Message))
                throw new ArgumentException("SNS message body is empty", nameof(record));

            payloadJson = sns.Message;
        }

        var wrapper = JsonConvert.DeserializeObject<BookingSyncTransferWrapper>(payloadJson, JsonSettings);
        return wrapper ?? throw new ArgumentException("Booking payload is invalid");
    }

    /// <summary>
    /// Logs failure details to DynamoDB.
    /// </summary>
    /// <param name="messageId">SQS message identifier.</param>
    /// <param name="bookingId">Booking identifier.</param>
    /// <param name="version">Booking version.</param>
    /// <param name="ex">Exception thrown during processing.</param>
    private async Task LogFailureAsync(string messageId, string bookingId, string version, Exception ex)
    {
        try
        {
            var item = new Dictionary<string, AttributeValue>
            {
                ["MessageId"] = new(messageId),
                ["BookingId"] = new(bookingId),
                ["BookingVersion"] = new(version),
                ["ErrorMessage"] = new(ex.Message),
                ["Timestamp"] = new(DateTime.UtcNow.ToString(CultureInfo.InvariantCulture))
            };
            var request = new PutItemRequest
            {
                TableName = _settings.LogTableName,
                Item = item
            };
            await _dynamoDb.PutItemAsync(request);
        }
        catch (Exception dbEx)
        {
            _logger.LogError(dbEx, "Failed writing to DynamoDB for MessageId {MessageId}, BookingId {BookingId}, Version {Version}", messageId, bookingId, version);
        }
    }
}