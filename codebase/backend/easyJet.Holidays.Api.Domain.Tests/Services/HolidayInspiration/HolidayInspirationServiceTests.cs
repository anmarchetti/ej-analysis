using AutoFixture;
using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Destinations;
using easyJet.Holidays.Api.Domain.Data.DynamoDB.Weather;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.RecommendedDestination;
using easyJet.Holidays.Api.Domain.Data.ReferenceData;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Data.SmartSeer;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Interfaces.Availability;
using easyJet.Holidays.Api.Domain.Interfaces.Destinations;
using easyJet.Holidays.Api.Domain.Interfaces.SmartSeer;
using easyJet.Holidays.Api.Domain.Interfaces.Weather;
using easyJet.Holidays.Api.Domain.Services.HolidayInspiration;
using easyJet.Holidays.Api.Domain.Services.Market;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Moq;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.HolidayInspiration
{
    public class HolidayInspirationServiceTests
    {
        private readonly IFixture _fixture;
        private readonly Mock<ISmartSeerService> _smartSeerService;
        private readonly Mock<IMarketService> _marketService;
        private readonly Mock<IWeatherService> _weatherService;
        private readonly Mock<IRouteAvailabilityService> _routeAvailabilityService;
        private readonly Mock<IReferenceDataService> _referenceDataService;
        private readonly Mock<IDestinationsService> _destinationsService;
        private readonly HolidayInspirationService _sut;

        public HolidayInspirationServiceTests()
        {
            _fixture = FixtureUtils.AutoMoqFixture();
            _routeAvailabilityService = _fixture.Freeze<Mock<IRouteAvailabilityService>>();
            _weatherService = _fixture.Freeze<Mock<IWeatherService>>();
            _referenceDataService = _fixture.Freeze<Mock<IReferenceDataService>>();
            _destinationsService = _fixture.Freeze<Mock<IDestinationsService>>();
            _smartSeerService = _fixture.Freeze<Mock<ISmartSeerService>>();
            _marketService = _fixture.Freeze<Mock<IMarketService>>();

            _referenceDataService.Setup(x => x.GetWeatherTypes()).ReturnsAsync(new WeatherTypes()
            {
                Children =
                [
                    new WeatherType()
                    {
                        Code = "WHS",
                        TemperatureMax = null,
                        TemperatureMin = 15
                    }
                ]
            });

            _sut = _fixture.Create<HolidayInspirationService>();
        }

        [Fact]
        public async Task GetRecommendedDestinations_WhenOnlyOneMonthMatchesWeather_ShouldReturnThatDestination()
        {
            // Arrange
            _marketService
                .Setup(x => x.GetCurrentMarket())
                .Returns(new MarketSettings
                {
                    Code = "UK"
                });

            _smartSeerService
                .Setup(x => x.GetRecommendedDestinations(It.IsAny<DestinationsRecommendationRequest>()))
                .ReturnsAsync(new SmartSeerRecommendations { DestinationCodes = ["ESMA"] });

            _routeAvailabilityService
                .Setup(x => x.GetDestinationAvailability(It.IsAny<string>(), It.IsAny<int>(), It.IsAny<DateTime?>(), It.IsAny<DateTime?>(), It.IsAny<int?>(), null))
                .ReturnsAsync(new DestinationsSearchResponse()
                {
                    Destinations =
                    [
                        new DestinationItem()
                        {
                            Code = "ESMA"
                        }
                    ]
                });

            _weatherService.Setup(x => x.GetAllWeather()).ReturnsAsync(new Dictionary<string, RegionWeather>()
            {
                { "ESMA", new RegionWeather() { AverageTemp = [6, 7, 10, 13, 18, 23, 27, 27, 22, 17, 10, 7] } },
            });

            _destinationsService.Setup(x => x.GetDestinationInfo(It.IsAny<string>())).ReturnsAsync(new DestinationInfo()
            {
                Code = "ESMA",
                Url = new Uri("/destinations/spain/majorca", UriKind.Relative)
            });

            // Act
            var result = await _sut.GetRecommendedDestinations(new RecommendedDestinationsRequest()
            {
                Departure = "LGW",
                FlexibleDays = 0,
                Dates =
                [
                    new(DateTimeUtc.New(2024, 11, 01), DateTimeUtc.New(2025, 05, 15))
                ],
                Tags = "TGBS, VBLUX",
                Weather = "WHS"
            });

            result.Destinations.Should().NotBeNull();
            result.Destinations.Count().Should().Be(1);
            result.Destinations.First().Code.Should().Be("ESMA");
        }

        [Theory]
        [MemberData(nameof(RecommendedDestinations_ValidateTravelPartyFromTags_TestData))]
        public async Task GetRecommendedDestinations_ValidateTravelPartyFromTags(string partyTag, int adults, int[] children)
        {
            // Arrange
            _marketService
                .Setup(x => x.GetCurrentMarket())
                .Returns(new MarketSettings
                {
                    Code = "UK"
                });

            _smartSeerService
                .Setup(x => x.GetRecommendedDestinations(It.IsAny<DestinationsRecommendationRequest>()))
                .ReturnsAsync(new SmartSeerRecommendations { DestinationCodes = [] });

            // Act
            var result = await _sut.GetRecommendedDestinations(new RecommendedDestinationsRequest()
            {
                Departure = "LGW",
                FlexibleDays = 0,
                Dates =
                [
                    new(DateTimeUtc.New(2024, 11, 01), DateTimeUtc.New(2025, 05, 15))
                ],
                Tags = partyTag,
                Weather = "WHS"
            });

            _smartSeerService
                .Verify(x => x.GetRecommendedDestinations(It.Is<DestinationsRecommendationRequest>(x =>
                    x.Adults == adults &&
                    (x.ChildAges == null && children == null || x.ChildAges != null && x.ChildAges.Zip(children).All(x => x.First == x.Second))
                )));
        }

        [Fact]
        public async Task GetRecommendedDestinations_WhenCmsThrowApiExpection_CatchErrorAndReturnEmptyCollection()
        {
            // Arrange
            _marketService
                .Setup(x => x.GetCurrentMarket())
                .Returns(new MarketSettings
                {
                    Code = "UK"
                });

            _smartSeerService
                .Setup(x => x.GetRecommendedDestinations(It.IsAny<DestinationsRecommendationRequest>()))
                .ReturnsAsync(new SmartSeerRecommendations { DestinationCodes = ["ESMA"] });

            _routeAvailabilityService
                .Setup(x => x.GetDestinationAvailability(It.IsAny<string>(), It.IsAny<int>(), It.IsAny<DateTime?>(), It.IsAny<DateTime?>(), It.IsAny<int?>(), null))
                .ReturnsAsync(new DestinationsSearchResponse()
                {
                    Destinations =
                    [
                        new DestinationItem()
                        {
                            Code = "ESMA"
                        }
                    ]
                });

            _weatherService.Setup(x => x.GetAllWeather()).ReturnsAsync(new Dictionary<string, RegionWeather>()
            {
                { "ESMA", new RegionWeather() { AverageTemp = [6, 7, 10, 13, 18, 23, 27, 27, 22, 17, 10, 7] } },
            });

            _destinationsService.Setup(x => x.GetDestinationInfo(It.IsAny<string>())).ThrowsAsync(new ApiException(ApiExceptionCodes.DestinationInfoError));

            // Act
            var result = await _sut.GetRecommendedDestinations(new RecommendedDestinationsRequest()
            {
                Departure = "LGW",
                FlexibleDays = 0,
                Dates =
                [
                    new(DateTimeUtc.New(2024, 11, 01), DateTimeUtc.New(2025, 05, 15))
                ],
                Tags = "TGBS, VBLUX",
                Weather = "WHS"
            });

            result.Destinations.Should().BeEmpty();
        }
        
        [Fact]
        public async Task GetRecommendedDestinations_WhenDestinationCodesIfEmptyAfterFiltering_DoNotCallCMSEndpoint()
        {
            // Arrange
            _marketService
                .Setup(x => x.GetCurrentMarket())
                .Returns(new MarketSettings
                {
                    Code = "UK"
                });

            _smartSeerService
                .Setup(x => x.GetRecommendedDestinations(It.IsAny<DestinationsRecommendationRequest>()))
                .ReturnsAsync(new SmartSeerRecommendations { DestinationCodes = [] });

            _routeAvailabilityService
                .Setup(x => x.GetDestinationAvailability(It.IsAny<string>(), It.IsAny<int>(), It.IsAny<DateTime?>(), It.IsAny<DateTime?>(), It.IsAny<int?>(), null))
                .ReturnsAsync(new DestinationsSearchResponse()
                {
                    Destinations = []
                });

            _weatherService.Setup(x => x.GetAllWeather()).ReturnsAsync(new Dictionary<string, RegionWeather>());

            _destinationsService.Setup(x => x.GetDestinationInfo(It.IsAny<string>())).ThrowsAsync(new ApiException(ApiExceptionCodes.DestinationInfoError));

            // Act
            var result = await _sut.GetRecommendedDestinations(new RecommendedDestinationsRequest()
            {
                Departure = "LGW",
                FlexibleDays = 0,
                Dates =
                [
                    new(DateTimeUtc.New(2024, 11, 01), DateTimeUtc.New(2025, 05, 15))
                ],
                Tags = "TGBS, VBLUX",
                Weather = "WHS"
            });

            result.Destinations.Should().BeEmpty();
            _destinationsService.Verify(service => service.GetDestinationInfo(It.IsAny<string>()), Times.Never());
        }

        public static IEnumerable<object[]> RecommendedDestinations_ValidateTravelPartyFromTags_TestData
        {
            get
            {
                yield return new object[] {
                "TGFML",
                2,
                new int[] { 5 }
            };
                yield return new object[] {
                "TGFRND",
                3,
                null
            };
                yield return new object[] {
                "TGPRTNR",
                2,
                null
            };
                yield return new object[] {
                "TGSL",
                1,
                null
            };
            }
        }

        [Fact]
        public async Task ValidateAnswers_WhenOnlyDepartureIsSet_ShouldReturnAllMonths()
        {
            // Arrange
            _routeAvailabilityService
                .Setup(x => x.GetDestinationAvailability(It.IsAny<string>(), It.IsAny<int>(), It.IsAny<DateTime?>(), It.IsAny<DateTime?>(), It.IsAny<int?>(), null))
                .ReturnsAsync(new DestinationsSearchResponse()
                {
                    Destinations = [new DestinationItem() { Code = "ESMA" }, new DestinationItem() { Code = "ESTF" }]
                });

            // Act
            var result = await _sut.ValidateAnswers(new ValidateRecommendedRequest()
            {
                Departure = "LGW"
            });

            result.Months.Should().BeSubsetOf([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
        }


        [Fact]
        public async Task ValidateAnswers_WhenWeatherIsSet_ShouldReturnAvailableMonths()
        {
            // Arrange
            _routeAvailabilityService
                .Setup(x => x.GetDestinationAvailability(It.IsAny<string>(), It.IsAny<int>(), It.IsAny<DateTime?>(), It.IsAny<DateTime?>(), It.IsAny<int?>(), null))
                .ReturnsAsync(new DestinationsSearchResponse()
                {
                    Destinations = [new DestinationItem() { Code = "ESMA" }, new DestinationItem() { Code = "ESTF" }]
                });

            _weatherService.Setup(x => x.GetAllWeather()).ReturnsAsync(new Dictionary<string, RegionWeather>()
            {
                { "ESTF", new RegionWeather() { AverageTemp = new int[] { 15, 20, 17, 18, 19, 10, 13, -5, 15, 30, 25, 9 } } }
            });

            // Act
            var result = await _sut.ValidateAnswers(new ValidateRecommendedRequest()
            {
                Departure = "LGW",
                Weather = "WHS",
            });

            result.Months.Should().BeSubsetOf([1, 2, 3, 4, 5, 9, 10, 11]);
        }

        [Fact]
        public async Task ValidateAnswers_WhenNoMonthsAvailable_ShouldReturnAllMonths()
        {
            // Act
            var result = await _sut.ValidateAnswers(new ValidateRecommendedRequest()
            {
                Weather = null
            });

            result.Months.Should().HaveCount(12);
            result.Months.Should().BeEquivalentTo([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
        }
    }
}
