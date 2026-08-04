using Amazon.S3.Transfer;
using Amazon.SQS;
using Amazon.SQS.Model;
using easyJet.Holidays.Api.Domain.Data.FlightPriceStore;
using easyJet.Holidays.Api.Domain.Utils;
using easyJet.Holidays.External.AWS.FPSExport.Service;
using easyJet.Holidays.External.AWS.FPSExport.Settings;
using easyJet.Holidays.External.AWS.Services.FlightPrice;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Newtonsoft.Json;

namespace easyJet.Holidays.External.AWS.FPSExport.Tests.Services;

public class FpsExportingServiceTests
{
    private readonly Mock<ITransferUtility> _s3TransferUtility;
    private readonly Mock<IAmazonSQS> _sqsClient;
    private readonly Mock<IFlightPriceStoreService> _fpsService;
    private readonly Mock<IFpsSelectorService> _selectorService;
    private readonly LambdaSettings _lambdaSettings;

    private readonly FpsExportingService _sut;

    public FpsExportingServiceTests()
    {
        _s3TransferUtility = new();
        _sqsClient = new();
        _fpsService = new();
        _selectorService = new();
        Mock<ILogger<FpsExportingService>> logger = new();
        _lambdaSettings = new()
        {
            Currencies = "GBP,EUR",
            QueueUrl = "some/Queue"
        };

        _sut = new(
            _s3TransferUtility.Object,
            _sqsClient.Object,
            _fpsService.Object,
            _selectorService.Object,
            logger.Object,
            Options.Create(_lambdaSettings)
        );
    }

    [Fact]
    public async Task Export_ForDailyRuns_WhenThereAreNoItems_TakesNoAction()
    {
        // Arrange
        _selectorService.Setup(mock => mock.SelectFare(It.IsAny<IList<FlightPriceStoreModel>>()))
            .Returns((IList<FlightPriceStoreModel> x) => x);

        // Act
        await _sut.Export("Daily");

        // Assert
        _sqsClient.VerifyNoOtherCalls();
        _s3TransferUtility.VerifyNoOtherCalls();
    }

    public static TheoryData<ReceiveMessageResponse> EmptyMessageResponses => new()
    {
        new(new ()), // Messages will be null in sdk v4
        new(new (){ Messages = [] }) // will be empty in sdk v3
    };

    [Theory]
    [MemberData(nameof(EmptyMessageResponses))]
    public async Task Export_ForIntraDayRuns_WhenThereAreNoItems_TakesNoAction(ReceiveMessageResponse response)
    {
        // Arrange
        _selectorService.Setup(mock => mock.SelectFare(It.IsAny<IList<FlightPriceStoreModel>>()))
            .Returns((IList<FlightPriceStoreModel> x) => x);

        _sqsClient.Setup(mock =>
            mock.ReceiveMessageAsync(It.Is<ReceiveMessageRequest>(arg => arg.QueueUrl == _lambdaSettings.QueueUrl))
        ).ReturnsAsync(response);

        // Act
        await _sut.Export("Delta");

        // Assert
        _sqsClient.Verify(mock => mock.ReceiveMessageAsync(It.IsAny<ReceiveMessageRequest>()), Times.Once());
        _sqsClient.VerifyNoOtherCalls();

        _selectorService.Verify(mock => mock.SelectFare(It.Is<IList<FlightPriceStoreModel>>(arg => arg.Count == 0)));
        _selectorService.VerifyNoOtherCalls();

        _s3TransferUtility.VerifyNoOtherCalls();

        _fpsService.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Export_ForDailyRuns_FetchesFromDynamo_PersistsInS3()
    {
        // Arrange
        _fpsService.Setup(mock => mock.GetDailyItems(It.IsAny<DateTime>(), It.IsAny<string[]>()))
            .ReturnsAsync(new List<FlightPriceStoreModel>()
            {
                new()
                {
                    ID = Guid.NewGuid().ToString("N")
                }
            });

        _selectorService.Setup(mock => mock.SelectFare(It.IsAny<IList<FlightPriceStoreModel>>()))
            .Returns((IList<FlightPriceStoreModel> x) => x);

        // Act
        await _sut.Export("Daily");

        // Assert
        _sqsClient.VerifyNoOtherCalls();
        _s3TransferUtility.Verify(mock => mock.UploadAsync(It.IsAny<Stream>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()));
    }

    [Fact]
    public async Task Export_ForIntraDay_FetchesFromSqs_PersistsInS3()
    {
        // Arrange
        var payload = new List<FlightPriceStoreModel>() { new() { ID = Guid.NewGuid().ToString("N"), Currency = "GBP" } };

        _sqsClient.SetupSequence(mock => mock.ReceiveMessageAsync(It.IsAny<ReceiveMessageRequest>(), It.IsAny<CancellationToken>())).ReturnsAsync(new ReceiveMessageResponse()
        {
            Messages = [
                new Message()
                {
                    ReceiptHandle = "someHandle",
                    Body = JsonConvert.SerializeObject(payload)
                }
            ]
        })
        .ReturnsAsync(new ReceiveMessageResponse()
        {
            Messages = [] // ensuring that we don't loop forever with the previous return
        });

        _selectorService.Setup(mock => mock.SelectFare(It.IsAny<IList<FlightPriceStoreModel>>()))
            .Returns((IList<FlightPriceStoreModel> x) => x);

        // Act
        await _sut.Export("notDaily");

        // Assert
        _fpsService.VerifyNoOtherCalls();
        _s3TransferUtility.Verify(mock => mock.UploadAsync(It.IsAny<Stream>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()));
    }

    [Fact]
    public async Task Export_ForDailyRuns_WithNewFareClassEnabled_OverwritesFareClassBeforePersisting()
    {
        // Arrange
        _lambdaSettings.NewFareClassPhaseOneEnabled = true;

        _fpsService.Setup(mock => mock.GetDailyItems(It.IsAny<DateTime>(), It.IsAny<string[]>()))
            .ReturnsAsync(new List<FlightPriceStoreModel>()
            {
                new()
                {
                    ID = Guid.NewGuid().ToString("N"),
                    FareType = FareType.HolidaysDiscounted.GetKnownFareType()
                },
                new()
                {
                    ID = Guid.NewGuid().ToString("N"),
                    FareType = FareType.Promotion.GetKnownFareType()
                }
            });

        _selectorService.Setup(mock => mock.SelectFare(It.IsAny<IList<FlightPriceStoreModel>>()))
            .Returns((IList<FlightPriceStoreModel> x) => x);

        var args = new List<Stream>();

        _s3TransferUtility.Setup(
            mock =>
                mock.UploadAsync(Capture.In(args), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>())
        );

        // Act
        await _sut.Export("Daily");

        // Assert
        _sqsClient.VerifyNoOtherCalls();
        _s3TransferUtility.Verify(
            mock =>
                mock.UploadAsync(It.IsAny<Stream>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>())
        );

        args.Should().NotBeNullOrEmpty();
        var capture = args.First();

        var data = CsvHelperUtils<FlightPriceStoreModel>.Convert(CompressUtils.FromGzip(capture)).ToList();

        data.Should().NotBeNullOrEmpty();
        data.Should().OnlyContain(item => item.GetKnownFareType() == FareType.Standard);
    }
}