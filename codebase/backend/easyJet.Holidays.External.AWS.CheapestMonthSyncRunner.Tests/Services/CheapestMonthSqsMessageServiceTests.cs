using Amazon.SQS;
using Amazon.SQS.Model;
using easyJet.Holidays.Api.Domain.Data.Destinations;
using easyJet.Holidays.Api.Domain.Interfaces.Availability;
using easyJet.Holidays.External.AWS.CheapestMonthSyncRunner.Services;
using easyJet.Holidays.External.AWS.CheapestMonthSyncRunner.Services.Interfaces;
using easyJet.Holidays.External.AWS.CheapestMonthSyncRunner.Settings;
using easyJet.Holidays.External.AWS.Models.CheapestMonth;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;

namespace easyJet.Holidays.External.AWS.CheapestMonthSyncRunner.Tests.Services;
public class CheapestMonthSqsMessageServiceTests
{
    private readonly CheapestMonthSqsMessageService cheapestMonthSqsMessageService;
    private readonly Mock<IAmazonSQS> amazonSQSMock;
    private readonly Mock<IRouteAvailabilityService> routeAvailabilityServiceMock;
    private readonly Mock<IDestinationItemHelper> destinationItemHelperMock;
    private readonly Mock<ILogger<CheapestMonthSqsMessageService>> loggerMock;
    private readonly LambdaSettings lambdaSettings;
    private readonly IOptions<LambdaSettings> options;

    public CheapestMonthSqsMessageServiceTests()
    {
        amazonSQSMock = new Mock<IAmazonSQS>();
        routeAvailabilityServiceMock = new Mock<IRouteAvailabilityService>();
        destinationItemHelperMock = new Mock<IDestinationItemHelper>();
        loggerMock = new Mock<ILogger<CheapestMonthSqsMessageService>>();
        lambdaSettings = new LambdaSettings
        {
            Market = "UK",
            Language = "EN",
            SQS = new SqsSettings
            {
                QueueUrl = new Uri("http://queue-testing"),
                ChunkSize = 2
            }
        };
        options = Options.Create(lambdaSettings);

        cheapestMonthSqsMessageService = new CheapestMonthSqsMessageService(
            amazonSQSMock.Object,
            routeAvailabilityServiceMock.Object,
            destinationItemHelperMock.Object,
            loggerMock.Object,
            options);
    }

    [Fact]
    public async Task BuildMessagesPerSelection_IfNoAirportCodesReceived_EmptyListReturned()
    {
        var airportCodes = new List<string> {};
       
        var result = await cheapestMonthSqsMessageService.BuildMessagesPerSelectionAsync(airportCodes);

        result.Should().BeEmpty();
    }

    [Fact]
    public async Task BuildMessagesPerSelection_IfAirportHasDestinations_CreatesMessages()
    {
        var airportCodes = new List<string> { "A1"};
        var destinationSearchResponse = new DestinationsSearchResponse
        {
            Destinations = new List<DestinationItem>
            {
                new DestinationItem { Code = "R1"},
                new DestinationItem { Code = "R2"},
                new DestinationItem { Code = "R3"},
                new DestinationItem { Code = "R4"},
            }
        };
        var regionDetails = new List<RegionDetails> 
        { 
            new RegionDetails { CountryCode = "CC1", RegionCode = "RC1"},
            new RegionDetails { CountryCode = "CC2", RegionCode = "RC2"},
            new RegionDetails { CountryCode = "CC3", RegionCode = "RC3"},
            new RegionDetails { CountryCode = "CC4", RegionCode = "RC4"}
        };

        routeAvailabilityServiceMock
            .Setup(m => m.GetDestinationAvailability(It.Is<string>(x => x.Equals(airportCodes[0])), 0, null, null, null, null))
            .ReturnsAsync(destinationSearchResponse);
        destinationItemHelperMock
            .Setup(m => m.GetAllRegionsDetails(It.Is<List<DestinationItem>>(x => x.Equals(destinationSearchResponse.Destinations))))
            .Returns(regionDetails);

        var result = await cheapestMonthSqsMessageService.BuildMessagesPerSelectionAsync(airportCodes);

        destinationItemHelperMock
            .Verify(m => m.GetAllRegionsDetails(It.Is<List<DestinationItem>>(x => x.Equals(destinationSearchResponse.Destinations))), Times.Once);
        result.Count.Should().Be(regionDetails.Count);
    }

    [Fact]
    public async Task BuildMessagesPerSelection_IfAirportHasNoDestinations_NoMessagesCreated()
    {
        var airportCodes = new List<string> { "A1" };
        var destinationSearchResponse = new DestinationsSearchResponse
        {
            Destinations = null
        };

        routeAvailabilityServiceMock
            .Setup(m => m.GetDestinationAvailability(It.Is<string>(x => x.Equals(airportCodes[0])), 0, null, null, null, null))
            .ReturnsAsync(destinationSearchResponse);

        var result = await cheapestMonthSqsMessageService.BuildMessagesPerSelectionAsync(airportCodes);

        destinationItemHelperMock
            .Verify(m => m.GetAllRegionsDetails(It.Is<List<DestinationItem>>(x => x.Equals(destinationSearchResponse.Destinations))), Times.Never);
        result.Should().BeEmpty();
    }

    [Fact]
    public async Task BuildMessagesPerSelection_IfRegionDetailsNullOrEmpty_NoMessagesCreated()
    {
        var airportCodes = new List<string> { "A1" };
        var destinationSearchResponse = new DestinationsSearchResponse
        {
            Destinations = null
        };

        routeAvailabilityServiceMock
            .Setup(m => m.GetDestinationAvailability(It.Is<string>(x => x.Equals(airportCodes[0])), 0, null, null, null, null))
            .ReturnsAsync(destinationSearchResponse);
        destinationItemHelperMock
            .Setup(m => m.GetAllRegionsDetails(It.Is<List<DestinationItem>>(x => x.Equals(destinationSearchResponse.Destinations))))
            .Returns(new List<RegionDetails>());

        var result = await cheapestMonthSqsMessageService.BuildMessagesPerSelectionAsync(airportCodes);

        result.Should().BeEmpty();
    }

    [Fact]
    public async Task BuildMessagesPerSelection_IfAirportsHasDestinationsAndAnotherAirportHasNot_CorrectNumberOfMessagesCreated()
    {
        var airportCodes = new List<string> { "A1", "A2", "A3" };

        var destinationSearchResponseForAirportOne = new DestinationsSearchResponse
        {
            Destinations = new List<DestinationItem>
            {
                new DestinationItem { Code = "R1"},
            }
        };
        var destinationSearchResponseForAirportTwo = new DestinationsSearchResponse
        {
            Destinations = new List<DestinationItem>
            {
                new DestinationItem { Code = "R2"},
                new DestinationItem { Code = "R3"},
            }
        };

        var regionDetailsForAirportOne = new List<RegionDetails>
        {
            new RegionDetails { CountryCode = "CC1", RegionCode = "RC1"},
        };
        var regionDetailsForAirportTwo = new List<RegionDetails>
        {
            new RegionDetails { CountryCode = "CC1", RegionCode = "RC1"},
            new RegionDetails {CountryCode = "CC2", RegionCode = "RC2"}
        };

        routeAvailabilityServiceMock
            .Setup(m => m.GetDestinationAvailability(It.Is<string>(x => x.Equals(airportCodes[0])), 0, null, null, null, null))
            .ReturnsAsync(destinationSearchResponseForAirportOne);
        routeAvailabilityServiceMock
           .Setup(m => m.GetDestinationAvailability(It.Is<string>(x => x.Equals(airportCodes[1])), 0, null, null, null, null))
           .ReturnsAsync(destinationSearchResponseForAirportTwo);
        routeAvailabilityServiceMock
           .Setup(m => m.GetDestinationAvailability(It.Is<string>(x => x.Equals(airportCodes[2])), 0, null, null, null, null))
           .ReturnsAsync(new DestinationsSearchResponse());

        destinationItemHelperMock
            .Setup(m => m.GetAllRegionsDetails(It.Is<List<DestinationItem>>(x => x.Equals(destinationSearchResponseForAirportOne.Destinations))))
            .Returns(regionDetailsForAirportOne);
        destinationItemHelperMock
            .Setup(m => m.GetAllRegionsDetails(It.Is<List<DestinationItem>>(x => x.Equals(destinationSearchResponseForAirportTwo.Destinations))))
            .Returns(regionDetailsForAirportTwo);

        var expectedMessageCount = regionDetailsForAirportOne.Count + regionDetailsForAirportTwo.Count;

        var result = await cheapestMonthSqsMessageService.BuildMessagesPerSelectionAsync(airportCodes);

        result.Count.Should().Be(expectedMessageCount);
    }

    [Fact]
    public async Task SendMessages_BatchesAreSentToSqs()
    {
        var messages = new List<string> {"A1","A2","A3","A4","A5","A6","A7","A8","A9","10"};
        var expectedSqsSendCalls = messages.Count / lambdaSettings.SQS.ChunkSize;

        await cheapestMonthSqsMessageService.SendMessages(messages);

        amazonSQSMock.Verify(m => m.SendMessageBatchAsync(It.IsAny<SendMessageBatchRequest>(), It.IsAny<CancellationToken>()), Times.Exactly(expectedSqsSendCalls));
    }
}
