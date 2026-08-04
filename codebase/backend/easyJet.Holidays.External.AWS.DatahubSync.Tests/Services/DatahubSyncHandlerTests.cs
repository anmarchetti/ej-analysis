using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using Amazon.Lambda.Core;
using Amazon.Lambda.SQSEvents;
using Amazon.SimpleNotificationService.Model;
using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.ReferenceData;
using easyJet.Holidays.Api.Domain.Data.SharedServices.DataHub;
using easyJet.Holidays.Api.Domain.Interfaces.Cms;
using easyJet.Holidays.Api.Domain.Interfaces.SNS;
using easyJet.Holidays.External.Atcom.Models.Booking;
using easyJet.Holidays.External.Atcom.Models.Internal;
using easyJet.Holidays.External.AWS.DatahubSync.Builder;
using easyJet.Holidays.External.AWS.DatahubSync.Models;
using easyJet.Holidays.External.AWS.DatahubSync.Services;
using easyJet.Holidays.External.AWS.DatahubSync.Settings;
using easyJet.Holidays.External.AWS.Domain.Models;
using easyJet.Holidays.External.DataHub.Interfaces;
using easyJet.Holidays.External.DataHub.SoapReference;
using easyJet.Holidays.External.Domain.Models.Api.Payload;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Newtonsoft.Json;
using Xunit;
using LogLevel = Microsoft.Extensions.Logging.LogLevel;

namespace easyJet.Holidays.External.AWS.DatahubSync.Tests.Services;

public class DatahubSyncHandlerTests
{
    private readonly Mock<IAmazonDynamoDB> _dynamoDb;
    private readonly Mock<ISnsService> _snsService;
    private readonly Mock<IDataHubService> _dataHubService;
    private readonly Mock<IReferenceDataProvider> _referenceDataProvider;
    private readonly Mock<IBookingSyncTransferWrapperBuilder> _wrapperBuilder;
    private readonly Mock<IAtcomService> _bookingService;
    private readonly Mock<IFlightTimeService> _flightTimeService;
    private readonly Mock<ILogger<DatahubSyncHandler>> _logger;
    private readonly LambdaSettings _lambdaSettings;


    private readonly DatahubSyncHandler _sut;


    public DatahubSyncHandlerTests()
    {
        _dynamoDb = new Mock<IAmazonDynamoDB>();
        _snsService = new Mock<ISnsService>();
        _dataHubService = new Mock<IDataHubService>();
        _referenceDataProvider = new Mock<IReferenceDataProvider>();
        _wrapperBuilder = new Mock<IBookingSyncTransferWrapperBuilder>();
        _bookingService = new Mock<IAtcomService>();
        _flightTimeService = new Mock<IFlightTimeService>();
        _logger = new Mock<ILogger<DatahubSyncHandler>>();

        _lambdaSettings = new LambdaSettings
        {
            Delay = 10,
            LogTableName = "TestLogTable",
            EnableVprCall = true
        };


        _sut = new(
            _referenceDataProvider.Object,
            _bookingService.Object,
            _flightTimeService.Object,
            _wrapperBuilder.Object,
            _dataHubService.Object,
            _snsService.Object,
            _dynamoDb.Object,
            _logger.Object,
            Options.Create(_lambdaSettings)
        );
    }

    [Fact]
    public async Task FunctionHandlerProcessesValidMessageSuccessfully()
    {
        var bookingId = "5435234";
        var versionNumber = "1";
        var messageId = Guid.NewGuid().ToString();

        var sqsBooking = new SqsBooking { BookingId = bookingId, VersionNumber = versionNumber };
        var sqsEvent = CreateSqsEvent(messageId, JsonConvert.SerializeObject(sqsBooking));
        _ = new Mock<ILambdaContext>().Object;

        var specialRequestGroups = new SpecialRequests { SpecialRequestType = new List<SpecialRequestsGroup>() };
        _referenceDataProvider.Setup(x => x.GetAllSpecialRequests(It.IsAny<string>()))
            .ReturnsAsync(specialRequestGroups);

        // Set up reservation data with valid booking status
        var reservationData = new ReservationDataResponse()
        {
            Response = new Response()
            {
                Data_Hub = new Data_Hub_ResType()
                {
                    Reservation = new Data_Hub_ResTypeReservation()
                    {
                        Bkg_Sts = Data_Hub_ResTypeReservationBkg_Sts.BKG // Set valid booking status
                    }
                }
            }
        };
        _dataHubService.Setup(x => x.GetReservationData(
                It.Is<DatahubFetchRequest>(r => r.ReservationId == bookingId && r.Version == versionNumber)))
            .ReturnsAsync(reservationData);

        var atcomResponse = new DisplayResponse();
        _bookingService.Setup(x => x.GetBookingByBookingRef(bookingId, null))
            .ReturnsAsync(new DisplayBookingResponse { Payload = new XmlApiPayload<DisplayResponse>() { Body = atcomResponse } });

        var wrapper = new BookingSyncTransferWrapper();
        _wrapperBuilder.Setup(x => x.Build(
                reservationData,
                specialRequestGroups.SpecialRequestType,
                atcomResponse))
            .Returns(wrapper);

        _snsService.Setup(x => x.SendMessage(
                It.IsAny<string>(),
                null,
                It.IsAny<string>(),
                It.IsAny<Dictionary<string, MessageAttributeValue>>()))
            .Returns(Task.CompletedTask);

        var result = await _sut.Handle(sqsEvent);

        Assert.Empty(result.BatchItemFailures);
        _dataHubService.Verify(x => x.GetReservationData(It.IsAny<DatahubFetchRequest>()), Times.Once);
        _bookingService.Verify(x => x.GetBookingByBookingRef(bookingId, null), Times.Once);

        // Verify that flight time processing is called
        _flightTimeService.Verify(x => x.ProcessFlightTimes(reservationData), Times.Once);

        _wrapperBuilder.Verify(x => x.Build(reservationData, specialRequestGroups.SpecialRequestType, atcomResponse), Times.Once);

        _snsService.Verify(x => x.SendMessage(
                "Payload in binary attribute GZippedPayload for booking 5435234 version 1",
                null,
                "5435234",
                It.Is<Dictionary<string, MessageAttributeValue>>(attrs =>
                    attrs.ContainsKey("compressed") &&
                    attrs.ContainsKey("GZippedPayload") &&
                    attrs.ContainsKey("CompressionStats") &&
                    attrs.ContainsKey("gzipped") &&
                    attrs["compressed"].StringValue == "gzip" &&
                    attrs["gzipped"].StringValue == "true" &&
                    attrs["GZippedPayload"].DataType == "Binary")),
            Times.Once);
    }

    [Fact]
    public async Task FunctionHandlerSetsGzippedFalseForUncompressedMessage()
    {
        var bookingId = "5435234";
        var versionNumber = "1";
        var messageId = Guid.NewGuid().ToString();

        // Force the uncompressed path by setting a threshold larger than the payload.
        _lambdaSettings.CompressionThreshold = 100000;

        var sqsBooking = new SqsBooking { BookingId = bookingId, VersionNumber = versionNumber };
        var sqsEvent = CreateSqsEvent(messageId, JsonConvert.SerializeObject(sqsBooking));
        _ = new Mock<ILambdaContext>().Object;

        var specialRequestGroups = new SpecialRequests { SpecialRequestType = new List<SpecialRequestsGroup>() };
        _referenceDataProvider.Setup(x => x.GetAllSpecialRequests(It.IsAny<string>()))
            .ReturnsAsync(specialRequestGroups);

        var reservationData = new ReservationDataResponse()
        {
            Response = new Response()
            {
                Data_Hub = new Data_Hub_ResType()
                {
                    Reservation = new Data_Hub_ResTypeReservation()
                    {
                        Bkg_Sts = Data_Hub_ResTypeReservationBkg_Sts.BKG
                    }
                }
            }
        };
        _dataHubService.Setup(x => x.GetReservationData(It.IsAny<DatahubFetchRequest>()))
            .ReturnsAsync(reservationData);

        var atcomResponse = new DisplayResponse();
        _bookingService.Setup(x => x.GetBookingByBookingRef(bookingId, null))
            .ReturnsAsync(new DisplayBookingResponse { Payload = new XmlApiPayload<DisplayResponse>() { Body = atcomResponse } });

        var wrapper = new BookingSyncTransferWrapper();
        _wrapperBuilder.Setup(x => x.Build(reservationData, specialRequestGroups.SpecialRequestType, atcomResponse))
            .Returns(wrapper);

        _snsService.Setup(x => x.SendMessage(
                It.IsAny<string>(),
                null,
                It.IsAny<string>(),
                It.IsAny<Dictionary<string, MessageAttributeValue>>()))
            .Returns(Task.CompletedTask);

        var result = await _sut.Handle(sqsEvent);

        Assert.Empty(result.BatchItemFailures);

        // Uncompressed, non-replay payloads must still carry the "gzipped" attribute so the
        // downstream SNS "replay" filter policies have at least one attribute to evaluate.
        _snsService.Verify(x => x.SendMessage(
                It.IsAny<string>(),
                null,
                "5435234",
                It.Is<Dictionary<string, MessageAttributeValue>>(attrs =>
                    attrs.ContainsKey("gzipped") &&
                    attrs["gzipped"].StringValue == "false" &&
                    !attrs.ContainsKey("compressed") &&
                    !attrs.ContainsKey("GZippedPayload"))),
            Times.Once);
    }

    [Fact]
    public async Task FunctionHandlerWithVprDisabledDoesNotCallVrp()
    {
        var bookingId = "5435234";
        var versionNumber = "1";
        var messageId = Guid.NewGuid().ToString();

        _lambdaSettings.EnableVprCall = false; // Disable VRP call

        var sqsBooking = new SqsBooking { BookingId = bookingId, VersionNumber = versionNumber };
        var sqsEvent = CreateSqsEvent(messageId, JsonConvert.SerializeObject(sqsBooking));
        _ = new Mock<ILambdaContext>().Object;

        var specialRequestGroups = new SpecialRequests { SpecialRequestType = new List<SpecialRequestsGroup>() };
        _referenceDataProvider.Setup(x => x.GetAllSpecialRequests(It.IsAny<string>()))
            .ReturnsAsync(specialRequestGroups);

        var reservationData = new ReservationDataResponse()
        {
            Response = new Response()
            {
                Data_Hub = new Data_Hub_ResType()
                {
                    Reservation = new Data_Hub_ResTypeReservation()
                    {
                        Bkg_Sts = Data_Hub_ResTypeReservationBkg_Sts.BKG
                    }
                }
            }
        };
        _dataHubService.Setup(x => x.GetReservationData(It.IsAny<DatahubFetchRequest>()))
            .ReturnsAsync(reservationData);

        var wrapper = new BookingSyncTransferWrapper();
        _wrapperBuilder.Setup(x => x.Build(
                reservationData,
                specialRequestGroups.SpecialRequestType,
                null)) // VRP response should be null
            .Returns(wrapper);

        _snsService.Setup(x => x.SendMessage(It.IsAny<string>(), null, It.IsAny<string>(), It.IsAny<Dictionary<string, MessageAttributeValue>>()))
            .Returns(Task.CompletedTask);

        var result = await _sut.Handle(sqsEvent);

        Assert.Empty(result.BatchItemFailures);
        _dataHubService.Verify(x => x.GetReservationData(It.IsAny<DatahubFetchRequest>()), Times.Once);
        _bookingService.Verify(x => x.GetBookingByBookingRef(It.IsAny<string>(), It.IsAny<string>()), Times.Never);

        // Verify that flight time processing is still called even when VRP is disabled
        _flightTimeService.Verify(x => x.ProcessFlightTimes(reservationData), Times.Once);

        _wrapperBuilder.Verify(x => x.Build(reservationData, specialRequestGroups.SpecialRequestType, null), Times.Once);
    }

    [Fact]
    public async Task FunctionHandlerFiltersOutBookingWithInvalidStatus()
    {
        var bookingId = "5435234";
        var versionNumber = "1";
        var messageId = Guid.NewGuid().ToString();

        var sqsBooking = new SqsBooking { BookingId = bookingId, VersionNumber = versionNumber };
        var sqsEvent = CreateSqsEvent(messageId, JsonConvert.SerializeObject(sqsBooking));
        _ = new Mock<ILambdaContext>().Object;

        var specialRequestGroups = new SpecialRequests { SpecialRequestType = new List<SpecialRequestsGroup>() };
        _referenceDataProvider.Setup(x => x.GetAllSpecialRequests(It.IsAny<string>()))
            .ReturnsAsync(specialRequestGroups);

        // Set up reservation data with invalid booking status (OPT)
        var reservationData = new ReservationDataResponse()
        {
            Response = new Response()
            {
                Data_Hub = new Data_Hub_ResType()
                {
                    Reservation = new Data_Hub_ResTypeReservation()
                    {
                        Bkg_Sts = Data_Hub_ResTypeReservationBkg_Sts.OPT // Invalid status - should be filtered out
                    }
                }
            }
        };
        _dataHubService.Setup(x => x.GetReservationData(It.IsAny<DatahubFetchRequest>()))
            .ReturnsAsync(reservationData);

        var result = await _sut.Handle(sqsEvent);

        Assert.Empty(result.BatchItemFailures);
        _dataHubService.Verify(x => x.GetReservationData(It.IsAny<DatahubFetchRequest>()), Times.Once);

        // Verify flight time processing is NOT called for filtered bookings
        _flightTimeService.Verify(x => x.ProcessFlightTimes(It.IsAny<ReservationDataResponse>()), Times.Never);

        _wrapperBuilder.Verify(x => x.Build(It.IsAny<ReservationDataResponse>(), It.IsAny<IEnumerable<SpecialRequestsGroup>>(), It.IsAny<DisplayResponse>()), Times.Never);
        _snsService.Verify(x => x.SendMessage(It.IsAny<string>(), null, It.IsAny<string>(), It.IsAny<Dictionary<string, MessageAttributeValue>>()), Times.Never);
    }

    [Fact]
    public async Task FunctionHandlerProcessesCancelledBookingSuccessfully()
    {
        var bookingId = "5435234";
        var versionNumber = "1";
        var messageId = Guid.NewGuid().ToString();

        var sqsBooking = new SqsBooking { BookingId = bookingId, VersionNumber = versionNumber };
        var sqsEvent = CreateSqsEvent(messageId, JsonConvert.SerializeObject(sqsBooking));
        _ = new Mock<ILambdaContext>().Object;

        var specialRequestGroups = new SpecialRequests { SpecialRequestType = new List<SpecialRequestsGroup>() };
        _referenceDataProvider.Setup(x => x.GetAllSpecialRequests(It.IsAny<string>()))
            .ReturnsAsync(specialRequestGroups);

        // Set up reservation data with cancelled booking status (CNX)
        var reservationData = new ReservationDataResponse()
        {
            Response = new Response()
            {
                Data_Hub = new Data_Hub_ResType()
                {
                    Reservation = new Data_Hub_ResTypeReservation()
                    {
                        Bkg_Sts = Data_Hub_ResTypeReservationBkg_Sts.CNX // Valid cancelled status
                    }
                }
            }
        };
        _dataHubService.Setup(x => x.GetReservationData(It.IsAny<DatahubFetchRequest>()))
            .ReturnsAsync(reservationData);

        var atcomResponse = new DisplayResponse();
        _bookingService.Setup(x => x.GetBookingByBookingRef(bookingId, null))
            .ReturnsAsync(new DisplayBookingResponse { Payload = new XmlApiPayload<DisplayResponse>() { Body = atcomResponse } });

        var wrapper = new BookingSyncTransferWrapper();
        _wrapperBuilder.Setup(x => x.Build(reservationData, specialRequestGroups.SpecialRequestType, atcomResponse))
            .Returns(wrapper);

        _snsService.Setup(x => x.SendMessage(It.IsAny<string>(), null, It.IsAny<string>(), It.IsAny<Dictionary<string, MessageAttributeValue>>()))
            .Returns(Task.CompletedTask);

        var result = await _sut.Handle(sqsEvent);

        Assert.Empty(result.BatchItemFailures);
        _dataHubService.Verify(x => x.GetReservationData(It.IsAny<DatahubFetchRequest>()), Times.Once);
        _bookingService.Verify(x => x.GetBookingByBookingRef(bookingId, null), Times.Once);

        // Verify flight time processing is called for cancelled bookings
        _flightTimeService.Verify(x => x.ProcessFlightTimes(reservationData), Times.Once);

        _wrapperBuilder.Verify(x => x.Build(reservationData, specialRequestGroups.SpecialRequestType, atcomResponse), Times.Once);
        _snsService.Verify(x => x.SendMessage(It.IsAny<string>(), null, It.IsAny<string>(), It.IsAny<Dictionary<string, MessageAttributeValue>>()), Times.Once);
    }

    [Fact]
    public async Task FunctionHandlerProcessesMessageWhenPrefixMatches()
    {
        var bookingId = "6666999";
        _lambdaSettings.AllowedPrefix = "6";
        var versionNumber = "2";
        var messageId = Guid.NewGuid().ToString();

        var expectedMessage = "Payload in binary attribute GZippedPayload for booking 6666999 version 2";

        var sqsBooking = new SqsBooking { BookingId = bookingId, VersionNumber = versionNumber };
        var sqsEvent = CreateSqsEvent(messageId, JsonConvert.SerializeObject(sqsBooking));
        _ = new Mock<ILambdaContext>().Object;

        var specialRequestGroups = new SpecialRequests { SpecialRequestType = new List<SpecialRequestsGroup>() };
        _referenceDataProvider.Setup(x => x.GetAllSpecialRequests(It.IsAny<string>()))
            .ReturnsAsync(specialRequestGroups);

        var reservationData = new ReservationDataResponse()
        {
            Response = new Response()
            {
                Data_Hub = new Data_Hub_ResType()
                {
                    Reservation = new Data_Hub_ResTypeReservation()
                    {
                        Bkg_Sts = Data_Hub_ResTypeReservationBkg_Sts.BKG
                    }
                }
            }
        };
        _dataHubService.Setup(x => x.GetReservationData(
                It.Is<DatahubFetchRequest>(r => r.ReservationId == bookingId && r.Version == versionNumber)))
            .ReturnsAsync(reservationData);

        var atcomResponse = new DisplayResponse();
        _bookingService.Setup(x => x.GetBookingByBookingRef(bookingId, null))
            .ReturnsAsync(new DisplayBookingResponse { Payload = new XmlApiPayload<DisplayResponse>() { Body = atcomResponse } });

        var wrapper = new BookingSyncTransferWrapper();
        _wrapperBuilder.Setup(x => x.Build(reservationData, specialRequestGroups.SpecialRequestType, atcomResponse))
            .Returns(wrapper);

        _snsService.Setup(x => x.SendMessage(
                It.IsAny<string>(),
                null,
                It.IsAny<string>(),
                It.IsAny<Dictionary<string, MessageAttributeValue>>()))
            .Returns(Task.CompletedTask);

        var result = await _sut.Handle(sqsEvent);

        Assert.Empty(result.BatchItemFailures);
        _dataHubService.Verify(x => x.GetReservationData(It.IsAny<DatahubFetchRequest>()), Times.Once);

        // Verify flight time processing is called
        _flightTimeService.Verify(x => x.ProcessFlightTimes(reservationData), Times.Once);

        _wrapperBuilder.Verify(x => x.Build(reservationData, specialRequestGroups.SpecialRequestType, atcomResponse), Times.Once);

        _snsService.Verify(x => x.SendMessage(
                expectedMessage,
                null,
                "6666999",
                It.Is<Dictionary<string, MessageAttributeValue>>(attrs =>
                    attrs.ContainsKey("compressed") &&
                    attrs.ContainsKey("GZippedPayload") &&
                    attrs.ContainsKey("CompressionStats"))),
            Times.Once);
    }

    [Fact]
    public async Task FunctionHandlerProcessesMessageWithReplayAttributes()
    {
        var bookingId = "1234567";
        var versionNumber = "1";
        var messageId = Guid.NewGuid().ToString();

        var sqsBooking = new SqsBooking { BookingId = bookingId, VersionNumber = versionNumber };

        var sqsEvent = new SQSEvent
        {
            Records = [new SQSEvent.SQSMessage
            {
                MessageId = messageId,
                Body = JsonConvert.SerializeObject(sqsBooking),
                MessageAttributes = new Dictionary<string, SQSEvent.MessageAttribute>
                {
                    ["replay"] = new SQSEvent.MessageAttribute
                    {
                        DataType = "String",
                        StringValue = "true"
                    }
                }
            }]
        };

        _ = new Mock<ILambdaContext>().Object;

        var specialRequestGroups = new SpecialRequests { SpecialRequestType = new List<SpecialRequestsGroup>() };
        _referenceDataProvider.Setup(x => x.GetAllSpecialRequests(It.IsAny<string>()))
            .ReturnsAsync(specialRequestGroups);

        var reservationData = new ReservationDataResponse()
        {
            Response = new Response
            {
                Data_Hub = new Data_Hub_ResType
                {
                    Reservation = new Data_Hub_ResTypeReservation
                    {
                        Bkg_Sts = Data_Hub_ResTypeReservationBkg_Sts.BKG
                    }
                }
            }
        };
        _dataHubService.Setup(x => x.GetReservationData(It.IsAny<DatahubFetchRequest>()))
            .ReturnsAsync(reservationData);

        var atcomResponse = new DisplayResponse();
        _bookingService.Setup(x => x.GetBookingByBookingRef(bookingId, null))
            .ReturnsAsync(new DisplayBookingResponse { Payload = new XmlApiPayload<DisplayResponse>() { Body = atcomResponse } });

        var wrapper = new BookingSyncTransferWrapper();
        _wrapperBuilder.Setup(x => x.Build(It.IsAny<ReservationDataResponse>(), It.IsAny<IEnumerable<SpecialRequestsGroup>>(), It.IsAny<DisplayResponse>()))
            .Returns(wrapper);

        _snsService.Setup(x => x.SendMessage(
                It.IsAny<string>(),
                null,
                It.IsAny<string>(),
                It.IsAny<Dictionary<string, MessageAttributeValue>>()))
            .Returns(Task.CompletedTask);

        var result = await _sut.Handle(sqsEvent);

        Assert.Empty(result.BatchItemFailures);

        // Verify flight time processing is called
        _flightTimeService.Verify(x => x.ProcessFlightTimes(reservationData), Times.Once);

        _snsService.Verify(x => x.SendMessage(
                "Payload in binary attribute GZippedPayload for booking 1234567 version 1",
                null,
                "1234567",
                It.Is<Dictionary<string, MessageAttributeValue>>(attrs =>
                    attrs.ContainsKey("replay") &&
                    attrs.ContainsKey("compressed") &&
                    attrs.ContainsKey("GZippedPayload") &&
                    attrs.ContainsKey("CompressionStats") &&
                    attrs["replay"].StringValue == "true" &&
                    attrs["compressed"].StringValue == "gzip")),
            Times.Once);
    }

    [Fact]
    public async Task FunctionHandlerWhenDataHubServiceThrowsExceptionAddsMessageToFailuresAndLogsToDynamoDb()
    {
        var bookingId = "5435345";
        var versionNumber = "1";
        var messageId = Guid.NewGuid().ToString();

        var sqsBooking = new SqsBooking { BookingId = bookingId, VersionNumber = versionNumber };
        var sqsEvent = CreateSqsEvent(messageId, JsonConvert.SerializeObject(sqsBooking));
        _ = new Mock<ILambdaContext>().Object;

        var specialRequestGroups = new SpecialRequests { SpecialRequestType = new List<SpecialRequestsGroup>() };
        _referenceDataProvider.Setup(x => x.GetAllSpecialRequests(It.IsAny<string>()))
            .ReturnsAsync(specialRequestGroups);

        var expectedException = new ApiException(ApiExceptionCodes.SpecialRequestsReferenceDataError);
        _dataHubService.Setup(x => x.GetReservationData(It.IsAny<DatahubFetchRequest>()))
            .ThrowsAsync(expectedException);

        _dynamoDb.Setup(x => x.PutItemAsync(It.IsAny<PutItemRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PutItemResponse());

        var result = await _sut.Handle(sqsEvent);

        Assert.Single(result.BatchItemFailures);
        Assert.Equal(messageId, result.BatchItemFailures[0].ItemIdentifier);

        _logger.Verify(x => x.Log(
            LogLevel.Error,
            It.IsAny<EventId>(),
            It.Is<It.IsAnyType>((v, t) => true),
            It.Is<ApiException>(ex => ex == expectedException),
            It.Is<Func<It.IsAnyType, Exception, string>>((v, t) => true)!
        ), Times.Once);

        _dynamoDb.Verify(x => x.PutItemAsync(
            It.Is<PutItemRequest>(r => r.TableName == _lambdaSettings.LogTableName &&
                                        r.Item["MessageId"].S == messageId),
            It.IsAny<CancellationToken>()), Times.Once);

        // Verify flight time processing is NOT called when an exception occurs before reservation data retrieval
        _flightTimeService.Verify(x => x.ProcessFlightTimes(It.IsAny<ReservationDataResponse>()), Times.Never);

        _wrapperBuilder.Verify(x => x.Build(It.IsAny<ReservationDataResponse>(), It.IsAny<IEnumerable<SpecialRequestsGroup>>(), It.IsAny<DisplayResponse>()), Times.Never);
    }

    [Fact]
    public async Task FunctionHandlerWithInvalidMessageFormatHandlesException()
    {
        var messageId = Guid.NewGuid().ToString();
        var invalidMessageBody = "{ invalid json }";

        var sqsEvent = CreateSqsEvent(messageId, invalidMessageBody);
        _ = new Mock<ILambdaContext>().Object;

        var specialRequestGroups = new SpecialRequests { SpecialRequestType = new List<SpecialRequestsGroup>() };
        _referenceDataProvider.Setup(x => x.GetAllSpecialRequests(It.IsAny<string>()))
            .ReturnsAsync(specialRequestGroups);

        _dynamoDb.Setup(x => x.PutItemAsync(It.IsAny<PutItemRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PutItemResponse());

        var result = await _sut.Handle(sqsEvent);

        Assert.Single(result.BatchItemFailures);
        Assert.Equal(messageId, result.BatchItemFailures[0].ItemIdentifier);

        _dynamoDb.Verify(x => x.PutItemAsync(
            It.Is<PutItemRequest>(r => r.Item["MessageId"].S == messageId &&
                                        r.Item["EventBody"].S == invalidMessageBody),
            It.IsAny<CancellationToken>()), Times.Once);

        // Verify flight time processing is NOT called when message deserialization fails
        _flightTimeService.Verify(x => x.ProcessFlightTimes(It.IsAny<ReservationDataResponse>()), Times.Never);

        _wrapperBuilder.Verify(x => x.Build(It.IsAny<ReservationDataResponse>(), It.IsAny<IEnumerable<SpecialRequestsGroup>>(), It.IsAny<DisplayResponse>()), Times.Never);
    }

    [Fact]
    public async Task LogErrorToDynamoDbWhenDynamoDbThrowsExceptionLogsError()
    {
        var messageId = Guid.NewGuid().ToString();
        var messageBody = "test message";
        var sqsMessage = new SQSEvent.SQSMessage { MessageId = messageId, Body = messageBody };
        var exception = new AmazonDynamoDBException("Test exception");
        var dynamoException = new AmazonDynamoDBException("DynamoDB error");

        _dynamoDb.Setup(x => x.PutItemAsync(It.IsAny<PutItemRequest>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(dynamoException);

        var methodInfo = typeof(DatahubSyncHandler).GetMethod("LogErrorToDynamoDb", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
        await ((Task)methodInfo?.Invoke(_sut, [sqsMessage, exception])!)!;

        _logger.Verify(x => x.Log(
            LogLevel.Error,
            It.IsAny<EventId>(),
            It.Is<It.IsAnyType>((v, t) => true),
            It.Is<Exception>(ex => ex == dynamoException),
            It.Is<Func<It.IsAnyType, Exception, string>>((v, t) => true)!
        ), Times.Once);
    }

    [Fact]
    public async Task FunctionHandlerWithEmptySqsEventReturnsEmptyBatchFailures()
    {
        var sqsEvent = new SQSEvent { Records = new List<SQSEvent.SQSMessage>() };
        _ = new Mock<ILambdaContext>().Object;

        var specialRequestGroups = new SpecialRequests { SpecialRequestType = [] };
        _referenceDataProvider.Setup(x => x.GetAllSpecialRequests(It.IsAny<string>()))
            .ReturnsAsync(specialRequestGroups);

        var result = await _sut.Handle(sqsEvent);

        Assert.Empty(result.BatchItemFailures);
        _dataHubService.Verify(x => x.GetReservationData(It.IsAny<DatahubFetchRequest>()), Times.Never);
        _snsService.Verify(x => x.SendMessage(It.IsAny<string>(), null, null, It.IsAny<Dictionary<string, MessageAttributeValue>>()), Times.Never);

        // Verify flight time processing is NOT called for empty events
        _flightTimeService.Verify(x => x.ProcessFlightTimes(It.IsAny<ReservationDataResponse>()), Times.Never);

        _wrapperBuilder.Verify(x => x.Build(It.IsAny<ReservationDataResponse>(), It.IsAny<IEnumerable<SpecialRequestsGroup>>(), It.IsAny<DisplayResponse>()), Times.Never);
    }

    private static SQSEvent CreateSqsEvent(string messageId, string messageBody)
    {
        return new SQSEvent
        {
            Records = [new SQSEvent.SQSMessage() { MessageId = messageId, Body = messageBody }]
        };
    }
}