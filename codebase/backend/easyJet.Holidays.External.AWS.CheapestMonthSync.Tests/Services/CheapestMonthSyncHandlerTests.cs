using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using Amazon.Lambda.SQSEvents;
using easyJet.Holidays.Api.Domain.Data.Common;
using easyJet.Holidays.Api.Domain.Data.Search;
using easyJet.Holidays.Api.Domain.Interfaces.Availability;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.AWS.CheapestMonthSync.Services;
using easyJet.Holidays.External.AWS.CheapestMonthSync.Services.Interfaces;
using easyJet.Holidays.External.AWS.CheapestMonthSync.Settings;
using easyJet.Holidays.External.AWS.Models.CheapestMonth;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.AWS.CheapestMonthSync.Tests.Services
{
    public class CheapestMonthSyncHandlerTests
    {
        private readonly Mock<IAtcomRequestParamBuilder> atcomRequestParamBuilderMock;
        private readonly Mock<ICheapestMonthService> cheapestMonthServiceMock;
        private readonly Mock<IRouteAvailabilityService> routeAvailabilityServiceMock;

        private readonly Mock<IAmazonDynamoDB> amazonDynamoDBMock;
        private readonly Mock<ILogger<CheapestMonthSyncHandler>> loggerMock;

        private readonly IOptions<AwsSettings> awsOptions;
        private readonly IOptions<LambdaSettings> lambdaOptions;

        public CheapestMonthSyncHandlerTests()
        {
            atcomRequestParamBuilderMock = new Mock<IAtcomRequestParamBuilder>();
            cheapestMonthServiceMock = new Mock<ICheapestMonthService>();
            routeAvailabilityServiceMock = new Mock<IRouteAvailabilityService>();
            amazonDynamoDBMock = new Mock<IAmazonDynamoDB>();
            loggerMock = new Mock<ILogger<CheapestMonthSyncHandler>>();

            var awsSettings = new AwsSettings { Storage = new AwsSettingsStorage { Tables = new AwsSettingsStorageTables { CheapestMonth = "table"} } };
            awsOptions = Options.Create(awsSettings);
            var lambdaSettings = new LambdaSettings { Language = "EN", Market = "UK", IsLastAvailableFilterOn = false, AtcomSearchType = new AtcomSearchType { Normal = "S", Report = "R" }, PromoPageId = Guid.NewGuid() };
            lambdaOptions = Options.Create(lambdaSettings);
        }

        [Fact]
        public async Task Handle_SqSEventContainsNoRecords_ExceptionThrown()
        {
            var sqsEvent = new SQSEvent { Records = new List<SQSEvent.SQSMessage>() };

            var handler = new CheapestMonthSyncHandler(
                atcomRequestParamBuilderMock.Object,
                cheapestMonthServiceMock.Object,
                routeAvailabilityServiceMock.Object,
                amazonDynamoDBMock.Object,
                loggerMock.Object,
                awsOptions,
                lambdaOptions);

            await Assert.ThrowsAsync<InvalidOperationException>(() => handler.Handle(sqsEvent));
        }

        [Fact]
        public async Task Handle_SqSEventContainsRecordWithNoBody_ExecptionThrown()
        {
            var sqsEvent = new SQSEvent { Records = new List<SQSEvent.SQSMessage> { new SQSEvent.SQSMessage { Body = null } } };

            var handler = new CheapestMonthSyncHandler(
                atcomRequestParamBuilderMock.Object,
                cheapestMonthServiceMock.Object,
                routeAvailabilityServiceMock.Object,
                amazonDynamoDBMock.Object,
                loggerMock.Object,
                awsOptions,
                lambdaOptions);

            await Assert.ThrowsAsync<InvalidOperationException>(() => handler.Handle(sqsEvent));
        }

        [Fact]
        public async Task Handle_SqSEventContainsRecord_ExecptionThrown()
        {
            var sqsEvent = new SQSEvent { Records = new List<SQSEvent.SQSMessage> { new SQSEvent.SQSMessage { Body = "{\"RegionDetails\":{\"CountryCode\":\"AT\",\"RegionCode\":\"ATIN\",\"RelatedRegions\":null},\"AirportCode\":\"LGW\"}" } } };
            var mockedLastAvailableDate = DateTime.UtcNow.AddYears(2);
            var mockedCheapestMonthDetails = new CheapestMonthDetails { AirportCode = "A", Destination = "D", SearchStartDate = "2026-01-01", Month = 1, Year = 2026, Price = 100 };
            var mockedDateChunks = new List<DateTimeRange>
                {
                    new DateTimeRange(DateTime.UtcNow, DateTime.UtcNow.AddMonths(11)),
                    new DateTimeRange(DateTime.UtcNow.AddMonths(12), DateTime.UtcNow.AddMonths(23))
                };

            atcomRequestParamBuilderMock.Setup(m => m.LastDayOfMonthAfterMonths(It.IsAny<DateTime>(), It.IsAny<int>()))
                .Returns(mockedLastAvailableDate);

            atcomRequestParamBuilderMock.Setup(m => m.BuildDateRangeParamChunks(It.IsAny<DateTime>(), It.Is<DateTime>(x => x.Equals(mockedLastAvailableDate))))
                .Returns(new List<DateTimeRange>
                {
                    new DateTimeRange(DateTime.UtcNow, DateTime.UtcNow.AddMonths(11)),
                    new DateTimeRange(DateTime.UtcNow.AddMonths(12), DateTime.UtcNow.AddMonths(23))
                });

            cheapestMonthServiceMock.Setup(m => m.FindCheapestMonth(It.IsAny<SearchSelectionData>(), It.IsAny<DateTimeRange>()))
                .ReturnsAsync(mockedCheapestMonthDetails);

            var handler = new CheapestMonthSyncHandler(
                atcomRequestParamBuilderMock.Object,
                cheapestMonthServiceMock.Object,
                routeAvailabilityServiceMock.Object,
                amazonDynamoDBMock.Object,
                loggerMock.Object,
                awsOptions,
                lambdaOptions);

            await handler.Handle(sqsEvent);

            cheapestMonthServiceMock.Verify(m => m.FindCheapestMonth(It.IsAny<SearchSelectionData>(), It.IsAny<DateTimeRange>()), Times.Exactly(mockedDateChunks.Count * sqsEvent.Records.Count));
            amazonDynamoDBMock.Verify(m =>  m.PutItemAsync(It.IsAny<PutItemRequest>(), It.IsAny<CancellationToken>()), Times.Exactly(1));
        }
    }
}
