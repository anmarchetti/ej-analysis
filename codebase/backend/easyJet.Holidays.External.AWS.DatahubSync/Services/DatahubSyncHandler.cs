using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using Amazon.Lambda.SQSEvents;
using Amazon.SimpleNotificationService.Model;
using easyJet.Holidays.Api.Domain.Data.ReferenceData;
using easyJet.Holidays.Api.Domain.Data.SharedServices.DataHub;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Interfaces.Cms;
using easyJet.Holidays.Api.Domain.Interfaces.SNS;
using easyJet.Holidays.External.Atcom.Models.Booking;
using easyJet.Holidays.External.AWS.DatahubSync.Builder;
using easyJet.Holidays.External.AWS.DatahubSync.Models;
using easyJet.Holidays.External.AWS.DatahubSync.Settings;
using easyJet.Holidays.External.AWS.Domain.Exceptions;
using easyJet.Holidays.External.AWS.Domain.Models;
using easyJet.Holidays.External.AWS.Domain.Utils;
using easyJet.Holidays.External.DataHub.Interfaces;
using easyJet.Holidays.External.DataHub.SoapReference;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using System.IO.Compression;
using System.Text;

namespace easyJet.Holidays.External.AWS.DatahubSync.Services;

/// <inheritdoc cref="IDatahubSyncHandler"/>
public class DatahubSyncHandler : IDatahubSyncHandler
{
    private readonly IReferenceDataProvider _referenceDataProvider;
    private readonly IAtcomService _bookingService;
    private readonly IFlightTimeService _flightTimeService;
    private readonly IBookingSyncTransferWrapperBuilder _wrapperBuilder;
    private readonly IDataHubService _dataHubService;
    private readonly ISnsService _snsService;
    private readonly IAmazonDynamoDB _dynamoDbClient;
    private readonly ILogger<DatahubSyncHandler> _logger;
    private readonly LambdaSettings _lambdaSettings;

    /// <summary>
    /// standard ctor
    /// </summary>
    /// <param name="referenceDataProvider"></param>
    /// <param name="bookingService"></param>
    /// <param name="flightTimeService"></param>
    /// <param name="wrapperBuilder"></param>
    /// <param name="dataHubService"></param>
    /// <param name="snsService"></param>
    /// <param name="dynamoDbClient"></param>
    /// <param name="logger"></param>
    /// <param name="lambdaOptions"></param>
    public DatahubSyncHandler(
        IReferenceDataProvider referenceDataProvider,
        IAtcomService bookingService,
        IFlightTimeService flightTimeService,
        IBookingSyncTransferWrapperBuilder wrapperBuilder,
        IDataHubService dataHubService,
        ISnsService snsService,
        IAmazonDynamoDB dynamoDbClient,
        ILogger<DatahubSyncHandler> logger,
        IOptions<LambdaSettings> lambdaOptions)
    {
        _referenceDataProvider = referenceDataProvider;
        _bookingService = bookingService;
        _flightTimeService = flightTimeService;
        _wrapperBuilder = wrapperBuilder;
        _dataHubService = dataHubService;
        _snsService = snsService;
        _dynamoDbClient = dynamoDbClient;
        _logger = logger;

        ArgumentNullException.ThrowIfNull(lambdaOptions);
        _lambdaSettings = lambdaOptions.Value;
    }

    /// <inheritdoc />
    public async Task<SQSBatchResponse> Handle(SQSEvent? sqsEvent)
    {
        var response = new SQSBatchResponse { BatchItemFailures = new List<SQSBatchResponse.BatchItemFailure>() };
        var specialRequestGroups = await _referenceDataProvider.GetAllSpecialRequests(null);


        foreach (var message in sqsEvent?.Records ?? [])
        {
            try
            {
                await ProcessSqsMessage(message, specialRequestGroups);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to process SQS message {MessageId}", message.MessageId);
                await LogErrorToDynamoDb(message, ex);
                response.BatchItemFailures.Add(
                    new SQSBatchResponse.BatchItemFailure { ItemIdentifier = message.MessageId });
            }
        }
        return response;
    }

    private async Task ProcessSqsMessage(SQSEvent.SQSMessage message, SpecialRequests? specialRequestGroups)
    {
        await Task.Delay(_lambdaSettings.Delay);
        var sqsBooking = DeserializeMessage(message.Body);

        _logger.LogInformation("Process reservation: {BookingID}, version: {Version}", sqsBooking.BookingId, sqsBooking.VersionNumber);

        if (ShouldSkipMessage(sqsBooking))
            return;

        DisplayBookingResponse? atcomVprBookingResponse = null;
        if (_lambdaSettings.EnableVprCall)
        {
            _logger.LogInformation("VRP call enabled - fetching latest booking data for {BookingID}", sqsBooking.BookingId);
            atcomVprBookingResponse = await _bookingService.GetBookingByBookingRef(sqsBooking.BookingId);
        }
        else
        {
            _logger.LogInformation("VRP call disabled - skipping VRP data fetch for {BookingID}", sqsBooking.BookingId);
        }

        // Then get DataHub data for a specific version
        var fetchRequest = new DatahubFetchRequest
        {
            ReservationId = sqsBooking.BookingId,
            Version = sqsBooking.VersionNumber
        };

        var reservationData = await GetAndValidateReservationData(fetchRequest);

        if (ShouldFilterByBookingStatus(reservationData))
        {
            _logger.LogInformation("Filtering out reservation {BookingID} - booking status is not BKG or CNL", sqsBooking.BookingId);
            return;
        }

        // Process flight times - compute missing UTC times from local times
        _flightTimeService.ProcessFlightTimes(reservationData);

        var bookingSyncTransferWrapper = _wrapperBuilder.Build(
            reservationData,
            specialRequestGroups?.SpecialRequestType,
            atcomVprBookingResponse?.Payload?.Body // Pass null if the VRP call is disabled
        );


        var messageAttributes = ExtractMessageAttributes(message);
        var payload = SerializeBookingWrapper(bookingSyncTransferWrapper);

        await SendToSns(payload, fetchRequest, sqsBooking, messageAttributes);

        _logger.LogInformation("Fetched reservation {ResId} version {Ver} successfully",
            fetchRequest.ReservationId, fetchRequest.Version);
    }

    private static SqsBooking DeserializeMessage(string messageBody)
    {
        return JsonConvert.DeserializeObject<SqsBooking>(messageBody)
               ?? throw new ArgumentException("Invalid message format");
    }

    private bool ShouldSkipMessage(SqsBooking sqsBooking)
    {
        if (string.IsNullOrEmpty(_lambdaSettings.AllowedPrefix)
            || sqsBooking.BookingId.StartsWith(_lambdaSettings.AllowedPrefix, StringComparison.Ordinal))
            return false;

        _logger.LogDebug(
            "Skipping reservation {BookingID}: does not start with expected prefix {AllowedPrefix}",
            sqsBooking.BookingId,
            _lambdaSettings.AllowedPrefix
        );
        return true;
    }

    private async Task<ReservationDataResponse> GetAndValidateReservationData(DatahubFetchRequest fetchRequest)
    {
        var reservationData = await _dataHubService.GetReservationData(fetchRequest);

        if (!reservationData.Response.Data_Hub.Err_Num.IsNullOrEmpty())
        {
            throw new DataHubResponseException(
                $"DataHub returned error {reservationData.Response.Data_Hub.Err_Num}: {reservationData.Response.Data_Hub.Err_Text}"
            );
        }

        return reservationData;
    }

    private static Dictionary<string, MessageAttributeValue>? ExtractMessageAttributes(SQSEvent.SQSMessage message)
    {
        if (message.MessageAttributes?.TryGetValue("replay", out var incoming) != true)
            return null;

        return new Dictionary<string, MessageAttributeValue>
        {
            ["replay"] = new()
            {
                DataType = incoming?.DataType,
                StringValue = incoming?.StringValue
            }
        };
    }

    private string SerializeBookingWrapper(BookingSyncTransferWrapper bookingSyncTransferWrapper)
    {
        var settings = new JsonSerializerSettings
        {
            Formatting = Formatting.None,
            NullValueHandling = NullValueHandling.Ignore,
            Converters = { new StringEnumConverter() },
        };

        var payload = JsonConvert.SerializeObject(bookingSyncTransferWrapper, settings);
        _logger.LogDebug("Sending message to SNS: {Payload}", payload);
        return payload;
    }

    private async Task SendToSns(string payload, DatahubFetchRequest fetchRequest, SqsBooking sqsBooking,
        Dictionary<string, MessageAttributeValue>? messageAttributes)
    {
        var payloadBytes = Encoding.UTF8.GetBytes(payload);
        var isGzipped = payloadBytes.Length > _lambdaSettings.CompressionThreshold;

        // Always set the "gzipped" attribute so that every message carries at least one
        // custom attribute. SNS filter policies (e.g. the downstream "replay" filters) are
        // skipped entirely for messages with no attributes, which previously caused
        // uncompressed, non-replay payloads to be excluded from all subscriptions.
        var attributes = MergeAttributes(messageAttributes, CreateGzippedAttribute(isGzipped));

        if (isGzipped)
        {
            await SendCompressedMessage(payload, payloadBytes, fetchRequest, sqsBooking, attributes);
        }
        else
        {
            await SendUncompressedMessage(payload, payloadBytes, fetchRequest, attributes);
        }
    }

    private async Task SendCompressedMessage(string payload, byte[] payloadBytes, DatahubFetchRequest fetchRequest,
        SqsBooking sqsBooking, Dictionary<string, MessageAttributeValue>? messageAttributes)
    {
        using var compressedData = CompressionUtilities.CompressToMemoryStream(payload, CompressionLevel.Optimal);
        var binaryStream = new MemoryStream(compressedData.ToArray());
        var compressionStats = $"Original size: {payloadBytes.Length} bytes, Compressed size: {compressedData.Length} bytes";

        var compressionAttributes = CreateCompressionAttributes(binaryStream, compressionStats);
        var finalAttributes = MergeAttributes(messageAttributes, compressionAttributes);

        _logger.LogDebug("Sending compressed message to SNS - {CompressionStats}", compressionStats);

        var deduplicationMessage = $"Payload in binary attribute GZippedPayload for booking {sqsBooking.BookingId} version {sqsBooking.VersionNumber}";
        await _snsService.SendMessage(deduplicationMessage, messageGroupId: fetchRequest.ReservationId, messageAttributes: finalAttributes);
    }

    private async Task SendUncompressedMessage(string payload, byte[] payloadBytes, DatahubFetchRequest fetchRequest,
        Dictionary<string, MessageAttributeValue>? messageAttributes)
    {
        _logger.LogDebug("Sending uncompressed message to SNS - Size: {Size} bytes (below compression threshold)", payloadBytes.Length);
        await _snsService.SendMessage(payload, messageGroupId: fetchRequest.ReservationId, messageAttributes: messageAttributes);
    }

    private static Dictionary<string, MessageAttributeValue> CreateGzippedAttribute(bool isGzipped)
    {
        return new Dictionary<string, MessageAttributeValue>
        {
            ["gzipped"] = new()
            {
                DataType = "String",
                StringValue = isGzipped ? "true" : "false"
            }
        };
    }

    private static Dictionary<string, MessageAttributeValue> CreateCompressionAttributes(MemoryStream binaryStream, string compressionStats)
    {
        return new Dictionary<string, MessageAttributeValue>
        {
            ["compressed"] = new()
            {
                DataType = "String",
                StringValue = "gzip"
            },
            ["GZippedPayload"] = new()
            {
                DataType = "Binary",
                BinaryValue = binaryStream
            },
            ["CompressionStats"] = new()
            {
                DataType = "String",
                StringValue = compressionStats
            }
        };
    }

    private static Dictionary<string, MessageAttributeValue> MergeAttributes(
        Dictionary<string, MessageAttributeValue>? existingAttributes,
        Dictionary<string, MessageAttributeValue> newAttributes)
    {
        if (existingAttributes == null)
            return newAttributes;

        foreach (var kvp in newAttributes)
        {
            existingAttributes[kvp.Key] = kvp.Value;
        }

        return existingAttributes;
    }

    private async Task LogErrorToDynamoDb(SQSEvent.SQSMessage message, Exception ex)
    {
        try
        {
            var request = new PutItemRequest
            {
                TableName = _lambdaSettings.LogTableName,
                Item = new Dictionary<string, AttributeValue>
                {
                    { "MessageId", new AttributeValue { S = message.MessageId } },
                    { "EventBody", new AttributeValue { S = message.Body } },
                    { "ErrorMessage", new AttributeValue { S = ex.Message } },
                    { "StackTrace", new AttributeValue { S = ex.StackTrace ?? string.Empty } },
                    { "CreatedDate", new AttributeValue { S = DateTime.UtcNow.ToString("o") } },
                }
            };

            await _dynamoDbClient.PutItemAsync(request);
            _logger.LogInformation("Error details for message {Body} stored in DynamoDB", message.Body);
        }
        catch (Exception dynamoEx)
        {
            _logger.LogError(dynamoEx, "Failed to log error to DynamoDB for message {MessageId}", message.MessageId);
        }

    }

    private static bool ShouldFilterByBookingStatus(ReservationDataResponse reservationData)
    {
        var bookingStatus = reservationData.Response?.Data_Hub?.Reservation?.Bkg_Sts.ToString();

        if (string.IsNullOrEmpty(bookingStatus))
        {
            return true;
        }

        var isValidStatus = bookingStatus.Equals("BKG", StringComparison.OrdinalIgnoreCase) ||
                            bookingStatus.Equals("CNX", StringComparison.OrdinalIgnoreCase);

        return !isValidStatus;
    }

}