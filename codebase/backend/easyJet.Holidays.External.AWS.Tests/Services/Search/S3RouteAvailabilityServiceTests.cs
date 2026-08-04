using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using AutoFixture;
using easyJet.Holidays.Api.Domain.Data.Availability;
using easyJet.Holidays.Api.Domain.Data.Destinations;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Interfaces.Availability;
using easyJet.Holidays.Api.Domain.Interfaces.Destinations;
using easyJet.Holidays.Api.Domain.Services.Cache;
using easyJet.Holidays.Api.Domain.Services.Market;
using easyJet.Holidays.Api.Domain.Services.Time;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.AWS.Services.Search;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.AWS.Tests.Services.Search
{
    public class S3RouteAvailabilityServiceTests
    {
        private IFixture _fixture;
        private readonly Mock<IDestinationsService> destinationsSearchService;
        private readonly S3RouteAvailabilityService sut;
        private readonly Mock<IAmazonDynamoDB> dynamoClient;
        private readonly Mock<ITimeProvider> timeProviderMock;

        private const string DynamoRoutesFromTable = "easyjet-holidays-routefile-from-test";
        private const string DynamoRoutesToTable = "easyjet-holidays-routefile-to-test";
        private const string DynamoDatesTable = "easyjet-holidays-routefile-dates-test";
        private const string DynamoVersionTable = "easyjet-holidays-routefile-version-test";

        public S3RouteAvailabilityServiceTests()
        {
            _fixture = FixtureUtils.AutoMoqFixture();
            _fixture.Register<ICacheService>(() => new NoCacheService());

            var awsSettings = _fixture.Freeze<Mock<IOptions<AwsSettings>>>();
            awsSettings
                .SetupGet(x => x.Value)
                .Returns(new AwsSettings
                {
                    Storage = new AwsSettingsStorage
                    {
                        Client = new AwsSettingsStorageClient
                        {
                            Region = string.Empty
                        },
                    },
                    Routes = new AwsRoutes
                    {
                        Tables = new AwsRoutesTables
                        {
                            Version = DynamoVersionTable,
                            Dates = DynamoDatesTable,
                            To = DynamoRoutesToTable,
                            From = DynamoRoutesFromTable
                        }
                    }
                });

            var cacheSettings = _fixture.Freeze<Mock<IOptions<CacheSettings>>>();
            cacheSettings
                .SetupGet(x => x.Value)
                .Returns(new CacheSettings
                {
                    Buckets = new Buckets
                    {
                        RoutesDates = "RoutesDates",
                        RoutesVersion = "RoutesVersion",
                        RoutesAvailability = "RoutesAvailability"
                    },
                    ExpirationSeconds = new Dictionary<string, int>()
                    {
                        {
                            "RoutesDates", 0
                        },
                        {
                            "RoutesAvailability", 0
                        }
                    }
                });

            var searchSettings = _fixture.Freeze<Mock<IOptions<SearchSettings>>>();
            searchSettings
                .SetupGet(x => x.Value)
                .Returns(new SearchSettings
                {
                    DefaultFlexibleDays = 3,
                    MonthsAheadLookup = 12
                });

            dynamoClient = _fixture.Freeze<Mock<IAmazonDynamoDB>>();

            dynamoClient
                .Setup(x => x.ScanAsync(
                    It.Is<ScanRequest>(sr => sr.TableName == DynamoVersionTable),
                    It.IsAny<CancellationToken>()))
                .ReturnsAsync(new ScanResponse
                {
                    Items =
                    [
                        new Dictionary<string, AttributeValue>
                        {
                            {
                                "version", new AttributeValue
                                {
                                    N = "1"
                                }
                            }
                        }
                    ]
                });

            var awsClient = _fixture.Freeze<Mock<AwsClient>>();
            awsClient
                .Setup(x => x.GetClient())
                .Returns(dynamoClient.Object);

            var marketSettings = new MarketSettings
            {
                Code = "GB",
                AirportDepartureCodes = ["BFS", "LTN", "LGW"]
            };

            var marketService = _fixture.Freeze<Mock<IMarketService>>();
            marketService
                .Setup(x => x.GetCurrentMarket())
                .Returns(marketSettings);

            marketService
                .Setup(x => x.GetMarket("GB"))
                .Returns(marketSettings);

            var routesRepository = new RouteDataRepository(
                _fixture.Freeze<ILogger<RouteDataRepository>>(),
                awsClient.Object,
                awsSettings.Object,
                _fixture.Freeze<ICacheService>(),
                cacheSettings.Object,
                marketService.Object);
            _fixture.Register<IRouteDataRepository>(() => routesRepository);

            destinationsSearchService = _fixture.Freeze<Mock<IDestinationsService>>();

            timeProviderMock = _fixture.Freeze<Mock<ITimeProvider>>();

            sut = _fixture.Create<S3RouteAvailabilityService>();
        }

        [Theory]
        [InlineData("X9000021", 0, null, null, null)]
        public async Task GetDepartureAvailability_To_Hotel_AnyDates(string to, int flexibleDays, DateTime? beginDate,
            DateTime? endDate, int? duration)
        {
            // Arrange
            destinationsSearchService
                .Setup(x => x.GetDestinationsByCodes(It.IsAny<string[]>(), It.IsAny<bool>()))
                .ReturnsAsync(new[] { GetMajorcaHotel() });

            var route = GetStringSetItem("arrival", "ACE", "departures", ["LGW"]);
            SetupDynamoQuery(DynamoRoutesFromTable, route);

            // Act
            var actual = await sut.GetDepartureAvailability(to, flexibleDays, beginDate, endDate, duration);

            // Assert
            actual.Should().NotBeNull();
            actual.Should().Contain("LGW");
        }

        [Theory]
        [InlineData("ESMJ", 0, null, null, null)]
        public async Task GetDepartureAvailability_To_Region_AnyDates(string to, int flexibleDays, DateTime? beginDate,
            DateTime? endDate, int? duration)
        {
            // Arrange
            destinationsSearchService
                .Setup(x => x.GetDestinationsByCodes(It.IsAny<string[]>(), It.IsAny<bool>()))
                .ReturnsAsync(new[] { GetMajorca() });

            var route = GetStringSetItem("arrival", "BCN", "departures", ["LGW", "LTN"]);
            SetupDynamoQuery(DynamoRoutesFromTable, route);

            // Act
            var actual = await sut.GetDepartureAvailability(to, flexibleDays, beginDate, endDate, duration);

            // Assert
            actual.Should().NotBeNull();
            actual.Should().HaveCount(2);
            actual.Should().Contain("LGW");
            actual.Should().Contain("LTN");
        }

        [Theory]
        [InlineData("LGW,LTN", 0, null, null, null)]
        public async Task GetDestinationAvailability_From_Two_Airports_Valid(string from, int flexibleDays,
            DateTime? beginDate, DateTime? endDate, int? duration)
        {
            // Arrange
            destinationsSearchService
                .Setup(x => x.GetDestinationsByAirportCodes(It.IsAny<string[]>(), It.IsAny<string>(), null))
                .ReturnsAsync(
                    new DestinationsSearchResponse
                    {
                        Destinations =
                        [
                            GetSpain(),
                            GetMajorca()
                        ]
                    });

            var route = GetStringSetItem("departure", "LGW", "arrivals", ["ACE", "BCN"]);
            SetupDynamoQuery(DynamoRoutesToTable, route);

            // Act
            var actual = await sut.GetDestinationAvailability(from, flexibleDays, beginDate, endDate, duration, null);

            // Assert
            actual.Should().NotBeNull();
            actual.Destinations.Should().NotBeNull();
            actual.Destinations.Should().HaveCount(2);
            actual.Destinations.Select(d => d.Code).ToList().Should().Contain("ES");
            actual.Destinations.Select(d => d.Code).ToList().Should().Contain("ESMJ");
        }

        [Theory]
        [MemberData(nameof(TestsData.GetAvailabilityDates_From_Two_Airports_To_Hotel_Within_Range_Fixed),
            MemberType = typeof(TestsData))]
        public async Task GetAvailabilityDates_From_Two_Airports_To_Hotel_Within_RangeValid(string from, string to,
            DateTime beginDate, DateTime endDate)
        {
            // Arrange
            destinationsSearchService
                .Setup(x => x.GetDestinationsByCodes(It.IsAny<string[]>(), It.IsAny<bool>()))
                .ReturnsAsync(new[] { GetMajorcaHotel() });

            SetupDirection("LGW", ["ACE"]);
            SetupDirection("LTN", ["BCN"]);
            SetupDirection("ACE", ["LGW"]);

            var route = GetStringItem("month", "2019-09", "departures", "28LGWACE,28ACELGW,29LTNBCN");
            SetupDynamoQuery(DynamoDatesTable, route);

            // Act
            var actual = await sut.GetAvailabilityDates(from, to, beginDate, endDate);

            // Assert
            actual.Should().NotBeNull();
            actual.Dates.Should().NotBeNull();
            actual.Dates.Should().HaveCount(32);
            actual.Dates[0].Should().BeEquivalentTo(new SingleDayAvailability
            {
                Date = "2019-09-29",
                Out = true,
                In = false
            });
        }

        [Fact]
        public async Task ExtendOtherAvailableRoutes_Test()
        {
            // Arrange
            var route = GetStringItem("month", "2020-09", "departures", "28ACBLGW,28ACBLTN,28ARCLTN");
            SetupDynamoQuery(DynamoDatesTable, route);

            var offers = new SearchOffersResponse()
            {
                Offers =
                [
                    new Offer()
                    {
                        Date = new DateTime(2020, 9, 28),
                        Accom = new Accom()
                        {
                            Code = "X9000022"
                        },
                        Hotel = new OfferHotel
                        {
                            Airports = ["ARC"]
                        }
                    },
                    new Offer()
                    {
                        Date = new DateTime(2020, 9, 28),
                        Accom = new Accom()
                        {
                            Code = "X9000021"
                        },
                        Hotel = new OfferHotel
                        {
                            Airports = ["ACB"]
                        }
                    }
                ]
            };

            // Act
            await sut.ExtendOtherAvailableRoutes(offers);

            // Assert
            offers.Offers[0].OtherRoutes.Should().BeEquivalentTo(new[] { "LTN" });
            offers.Offers[1].OtherRoutes.Should().BeEquivalentTo(new[] { "LTN", "LGW" });
        }

        [Theory]
        [MemberData(nameof(TestsData.GetAvailabilityDates_From_Two_Airports_To_Hotel_Within_Range_Fixed),
            MemberType = typeof(TestsData))]
        public async Task GetAvailabilityDates_From_Two_Airports_To_Hotel_Within_Range_NextAvailable(string from,
            string to, DateTime beginDate, DateTime endDate)
        {
            // Arrange
            destinationsSearchService
                .Setup(x => x.GetDestinationsByCodes(It.IsAny<string[]>(), It.IsAny<bool>()))
                .ReturnsAsync(new[] { GetMajorcaHotel() });

            SetupDirection("LGW", ["ACE"]);
            SetupDirection("LTN", ["BCN"]);
            SetupDirection("ACE", ["LGW"]);

            var routes = new Dictionary<string, AttributeValue>[]
            {
                GetStringItem("month", "2019-09", "departures", "28LGWACB,28ACBLGW,29LTBBCN"),
                GetStringItem("month", "2020-02", "departures", "28LGWACE,28ACELGW,29LTNBCN"),
            };
            SetupDynamoQuery(DynamoDatesTable, routes);

            // Act
            var actual = await sut.GetAvailabilityDates(from, to, beginDate, endDate);

            // Assert
            actual.Should().NotBeNull();
            actual.Dates.Should().NotBeNull();
            actual.Dates.Should().HaveCount(32);
            actual.Dates[0].Should().BeEquivalentTo(new SingleDayAvailability
            {
                Date = "2019-09-29",
                Out = false,
                In = false
            });

            actual.NextAvailableDate.Should().Be(new DateTime(2020, 02, 28));
        }

        [Theory]
        [MemberData(nameof(TestsData.GetAvailability_From_Two_Airports_Within_Range_Flexible),
            MemberType = typeof(TestsData))]
        public async Task GetAvailability_From_Two_Airports_Within_Range_Flexible1(string from, int flexibleDays,
            DateTime? beginDate, DateTime? endDate)
        {
            // Arrange
            var route = GetStringItem("month", "2019-09", "departures", "08LGWACE,15ACELGW,10LTNBCN,17BCNLTN");
            SetupDynamoQuery(DynamoDatesTable, route);

            destinationsSearchService
                .Setup(x => x.GetDestinationsByAirportCodes(It.IsAny<string[]>(), It.IsAny<string>(), null))
                .ReturnsAsync(
                    new DestinationsSearchResponse
                    {
                        Destinations =
                        [
                            GetSpain(),
                            GetMajorca()
                        ]
                    });

            // Act
            var actual = await sut.GetDestinationAvailability(from, flexibleDays, beginDate, endDate, null, null);

            // Assert
            actual.Should().NotBeNull();
            actual.Destinations.Should().NotBeNull();
            actual.Destinations.Should().HaveCount(2);
            actual.Destinations.Select(d => d.Code).ToList().Should().Contain("ES");
            actual.Destinations.Select(d => d.Code).ToList().Should().Contain("ESMJ");
        }

        [Theory]
        [MemberData(nameof(TestsData.GetAvailability_To_Region_Within_Range_Flexible), MemberType = typeof(TestsData))]
        public async Task GetAvailability_To_Region_Within_Range_Flexible(string to, int flexibleDays,
            DateTime? beginDate, DateTime? endDate)
        {
            // Arrange
            var route = GetStringItem("month", "2019-09", "departures", "08LGWACE,15ACELGW,10LTNBCN,08PMIACE,15ACEPMI");
            SetupDynamoQuery(DynamoDatesTable, route);

            destinationsSearchService
                .Setup(x => x.GetDestinationsByCodes(It.IsAny<string[]>(), It.IsAny<bool>()))
                .ReturnsAsync(new[] { GetMajorca() });

            // Act
            var actual = await sut.GetDepartureAvailability(to, flexibleDays, beginDate, endDate, null);

            // Assert
            actual.Should().NotBeNull();
            actual.Should().HaveCount(1);
            actual.Should().Contain("LGW");
        }

        [Theory]
        [MemberData(nameof(TestsData.GetAvailability_ToSameRegion), MemberType = typeof(TestsData))]
        public async Task GetAvailability_DepartureNotInMarket_ShouldIgnoreDeparture(string to, int flexibleDays,
            DateTime? beginDate, DateTime? endDate)
        {
            // Arrange
            var route = GetStringItem("month", "2019-09", "departures", "08LGWACE,15ACELGW,10LTNBCN,08PMIACE,15ACEPMI");
            SetupDynamoQuery(DynamoDatesTable, route);

            destinationsSearchService
                .Setup(x => x.GetDestinationsByCodes(It.IsAny<string[]>(), It.IsAny<bool>()))
                .ReturnsAsync(new[] { GetMajorca() });

            // Act
            var actual = await sut.GetDepartureAvailability(to, flexibleDays, beginDate, endDate, null);

            // Assert
            actual.Should().NotBeNull();
            actual.Should().HaveCount(1);
            actual.Should().Contain("LGW");
            actual.Should().NotContain("PMI");
        }

        [Theory]
        [MemberData(nameof(TestsData.GetAvailability_To_Region_Within_Range_CrossMonths),
            MemberType = typeof(TestsData))]
        public async Task GetAvailability_To_Region_Within_Range_CrossMonths(string to, int flexibleDays,
            DateTime? beginDate, DateTime? endDate)
        {
            // Arrange
            var routes = new Dictionary<string, AttributeValue>[]
            {
                GetStringItem("month", "2019-11", "departures", "28LGWACE,10LTNBCN,17BCNLTN"),
                GetStringItem("month", "2019-12", "departures", "03ACELGW,10LTNBCN,28LGWACE"),
                GetStringItem("month", "2020-01", "departures", "04ACELGW,15ACELGW,10LTNBCN,17BCNLTN"),

            };
            SetupDynamoQuery(DynamoDatesTable, routes);

            destinationsSearchService
                .Setup(x => x.GetDestinationsByCodes(It.IsAny<string[]>(), It.IsAny<bool>()))
                .ReturnsAsync(new[] { GetMajorca() });

            // Act
            var actual = await sut.GetDepartureAvailability(to, flexibleDays, beginDate, endDate, null);

            // Assert
            actual.Should().NotBeNull();
            actual.Should().HaveCount(1);
            actual.Should().Contain("LGW");
        }

        [Fact]
        public async Task GetDepartureAvailability_WhenDestinationAirportsAreNotSpecified_ShouldOnlyConsiderMarketAirportsForOutboundFlights()
        {
            // Arrange
            var route = GetStringItem("month", "2024-04", "departures", "14LTNBCN,14ACEBCN,20BCNLTN,20BCNACE");
            SetupDynamoQuery(DynamoDatesTable, route);

            // Act
            var res = await sut.GetDepartureAvailability(null, 0, new DateTime(2024, 04, 14), new DateTime(2024, 04, 20), null);

            // Assert
            res.Should().HaveCount(1);
            res.Should().Contain("LTN"); //LTN is an airport in UK market
            res.Should().NotContain("ACE"); //ACE is not an airport in UK market
        }

        [Fact]
        public async Task GetDepartureAvailability_WhenDurationNotSpecified_ShouldShiftDepartureSearchEndDate()
        {
            // Arrange
            var route = GetStringItem("month", "2024-04", "departures", "20LGWACE,27ACELGW");
            SetupDynamoQuery(DynamoDatesTable, route);

            destinationsSearchService
                .Setup(x => x.GetDestinationsByCodes(It.IsAny<string[]>(), It.IsAny<bool>()))
                .ReturnsAsync(new[] { GetMajorca() });

            // Act
            var res = await sut.GetDepartureAvailability("ESMJ", 0, new DateTime(2024, 04, 10), new DateTime(2024, 04, 20), null);

            // Assert
            res.Should().BeEmpty();
        }

        [Fact]
        public async Task GetDepartureAvailability_WhenDurationSpecified_ShouldKeepExactSearchWindow()
        {
            // Arrange
            var route = GetStringItem("month", "2024-04", "departures", "20LGWACE,27ACELGW");
            SetupDynamoQuery(DynamoDatesTable, route);

            destinationsSearchService
                .Setup(x => x.GetDestinationsByCodes(It.IsAny<string[]>(), It.IsAny<bool>()))
                .ReturnsAsync(new[] { GetMajorca() });

            // Act
            var res = await sut.GetDepartureAvailability("ESMJ", 0, new DateTime(2024, 04, 10), new DateTime(2024, 04, 20), 7);

            // Assert
            res.Should().HaveCount(1);
            res.Should().Contain("LGW");
        }

        [Fact]
        public async Task GetArrivalAirports_WhenDurationNotSpecified_ShouldShiftDepartureSearchEndDate()
        {
            // Arrange
            var route = GetStringItem("month", "2024-04", "departures", "20LGWACE,27ACELGW");
            SetupDynamoQuery(DynamoDatesTable, route);

            // Act
            var res = await sut.GetArrivalAirports("LGW", 0, new DateTime(2024, 04, 10), new DateTime(2024, 04, 20), null);

            // Assert
            res.Should().BeEmpty();
        }

        [Fact]
        public async Task GetArrivalAirports_WhenDurationSpecified_ShouldKeepExactSearchWindow()
        {
            // Arrange
            var route = GetStringItem("month", "2024-04", "departures", "20LGWACE,27ACELGW");
            SetupDynamoQuery(DynamoDatesTable, route);

            // Act
            var res = await sut.GetArrivalAirports("LGW", 0, new DateTime(2024, 04, 10), new DateTime(2024, 04, 20), 7);

            // Assert
            res.Should().HaveCount(1);
            res.Should().Contain("ACE");
        }

        [Theory]
        [MemberData(nameof(TestsData.GetDepartureAvailability_Flexible), MemberType = typeof(TestsData))]
        public async Task GetAvailability_To_From_Region_Within_Range_CrossMonths(string to, string from,
            int flexibleDays, DateTime beginDate, DateTime endDate, int duration)
        {
            // Arrange
            var route = GetStringItem("month", "2019-09", "departures", "10LGWACE,17ACELGW,17LTNBCN,28LGWACE");
            SetupDynamoQuery(DynamoDatesTable, route);

            destinationsSearchService
                .Setup(x => x.GetDestinationsByCodes(It.IsAny<string[]>(), It.IsAny<bool>()))
                .ReturnsAsync(new[] { GetMajorca() });

            // Act
            var actual = await sut.GetDepartureAvailability(to, from, flexibleDays, beginDate, endDate, duration);

            // Assert
            actual.Should().NotBeNull();
            actual.Should().HaveCount(1);
            actual.Should().Contain("LGW");
        }

        [Theory]
        [MemberData(nameof(TestsData.GetAvailabilityDates_From_Two_Airports_To_Hotel_Within_Range_Fixed),
            MemberType = typeof(TestsData))]
        public async Task GetAvailabilityDates_PromoPageIdWithin_RangeValid(string from, string to, DateTime beginDate,
            DateTime endDate)
        {
            // Arrange
            destinationsSearchService
                .Setup(x => x.GetPromoDestinations(It.IsAny<string>()))
                .ReturnsAsync(new[] { GetMajorcaHotel() });

            SetupDirection("LGW", ["ACE"]);
            SetupDirection("LTN", ["BCN"]);
            SetupDirection("ACE", ["LGW"]);

            var route = GetStringItem("month", "2019-09", "departures", "28LGWACE,28ACELGW,29LTNBCN");
            SetupDynamoQuery(DynamoDatesTable, route);

            // Act
            var actual = await sut.GetAvailabilityDates(from, string.Empty, beginDate, endDate, null, new Guid().ToString());

            // Assert
            actual.Should().NotBeNull();
            actual.Dates.Should().NotBeNull();
            actual.Dates.Should().HaveCount(32);
            actual.Dates[0].Should().BeEquivalentTo(new SingleDayAvailability
            {
                Date = "2019-09-29",
                Out = true,
                In = false
            });
        }

        [Theory]
        [MemberData(nameof(TestsData.GetAvailabilityDates_From_Two_Airports_To_Hotel_Within_Range_Fixed),
            MemberType = typeof(TestsData))]
        public async Task GetAvailabilityDates_PromoPageIdWithinRange_NextAvailable(string from, string to,
            DateTime beginDate, DateTime endDate)
        {
            // Arrange
            destinationsSearchService
                .Setup(x => x.GetPromoDestinations(It.IsAny<string>()))
                .ReturnsAsync(new[] { GetMajorcaHotel() });

            SetupDirection("LGW", ["ACE"]);
            SetupDirection("LTN", ["BCN"]);
            SetupDirection("ACE", ["LGW"]);

            var routes = new Dictionary<string, AttributeValue>[]
            {
                GetStringItem("month", "2019-09", "departures", "28LGWACB,28ACBLGW,29LTBBCN"),
                GetStringItem("month", "2020-02", "departures", "28LGWACE,28ACELGW,29LTNBCN"),

            };
            SetupDynamoQuery(DynamoDatesTable, routes);

            // Act
            var actual = await sut.GetAvailabilityDates(from, string.Empty, beginDate, endDate, null, new Guid().ToString());

            // Assert
            actual.Should().NotBeNull();
            actual.Dates.Should().NotBeNull();
            actual.Dates.Should().HaveCount(32);
            actual.Dates[0].Should().BeEquivalentTo(new SingleDayAvailability
            {
                Date = "2019-09-29",
                Out = false,
                In = false
            });

            actual.NextAvailableDate.Should().Be(new DateTime(2020, 02, 28));
        }

        [Theory]
        [MemberData(nameof(TestsData.GetAvailabilityDates_From_Two_Airports_To_Hotel_Within_Range_Fixed),
            MemberType = typeof(TestsData))]
        public async Task GetAvailabilityDates_WhenSelectedFromDateNull_AllPossibleInBoundAndOutboundDatesReturned(string from, string to, DateTime beginDate, DateTime endDate)
        {
            // Arrange
            destinationsSearchService
                .Setup(x => x.GetPromoDestinations(It.IsAny<string>()))
                .ReturnsAsync(new[] { GetMajorcaHotel() });

            SetupDirection("LGW", ["ACB"]);
            SetupDirection("LTN", ["BCN"]);
            SetupDirection("ACB", ["LGW"]);

            var routes = new Dictionary<string, AttributeValue>[]
            {
                GetStringItem("month", "2019-10", "departures", "10LGWACE,12ACELGW,13BCNLGW"),

            };
            SetupDynamoQuery(DynamoDatesTable, routes);

            // Act
            var actual = await sut.GetAvailabilityDates(from, string.Empty, beginDate, endDate, null, new Guid().ToString());

            // Assert
            actual.Should().NotBeNull();
            actual.Dates.Should().NotBeNull();
            actual.Dates.Should().HaveCount(32);
            actual.Dates.Where(x => x.Out == true).Should().HaveCount(1);
            actual.Dates.Where(x => x.In == true).Should().HaveCount(2);
        }

        [Theory]
        [MemberData(nameof(TestsData.GetAvailabilityDates_From_Two_Airports_To_Hotel_Within_Range_Fixed),
    MemberType = typeof(TestsData))]
        public async Task GetAvailabilityDates_WhenSelectedFromDateSetup_OnlyAccurateInboundOutboundDatesReturned(string from, string to, DateTime beginDate, DateTime endDate)
        {
            // Arrange
            destinationsSearchService
                .Setup(x => x.GetPromoDestinations(It.IsAny<string>()))
                .ReturnsAsync(new[] { GetMajorcaHotel() });

            SetupDirection("LGW", ["ACB"]);
            SetupDirection("LTN", ["BCN"]);
            SetupDirection("ACB", ["LGW"]);

            var routes = new Dictionary<string, AttributeValue>[]
            {
                GetStringItem("month", "2019-10", "departures", "05LGWACE,10LGWACE,11LGWACE,12ACELGW,13BCNLGW"),

            };
            SetupDynamoQuery(DynamoDatesTable, routes);

            // Act
            var actual = await sut.GetAvailabilityDates(from, string.Empty, beginDate, endDate, DateTime.Parse("2019-10-10"), new Guid().ToString());

            // Assert
            actual.Should().NotBeNull();
            actual.Dates.Should().NotBeNull();
            actual.Dates.Should().HaveCount(32);

            //all accurate outbound dates before selection
            actual.Dates.Where(x => x.Out == true).Should().HaveCount(2);

            //only acurate inbound dates so that the user can return from the same airport he departed from
            actual.Dates.Where(x => x.In == true).Should().HaveCount(1);
            actual.Dates.FirstOrDefault(x => x.Date.Equals("2019-10-12", StringComparison.Ordinal)).In.Should().BeTrue();
        }

        [Fact]
        public async Task GetAvailabilityMonths()
        {
            // Arrange
            var from = "LGW";
            var to = "ES";
            var year = 2024;
            timeProviderMock.Setup(x => x.UtcNow).Returns(DateTimeUtc.New(year, 1, 1));
            destinationsSearchService
                .Setup(x => x.GetDestinationsByCodes(It.IsAny<string[]>(), It.IsAny<bool>()))
                .ReturnsAsync([GetSpain()]);

            SetupDirection("LGW", ["ACE"]);
            SetupDirection("ACE", ["LGW"]);

            var routeMay = GetStringItem("month", $"{year}-05", "departures", "01LGWACE,08ACELGW");
            var routeSeptember = GetStringItem("month", $"{year}-09", "departures", "01LGWACE,08ACELGW");
            var lastAvailableDate = GetStringItem("month", $"{year}-10", "departures", $"01LGWACE");
            SetupDynamoQuery(DynamoDatesTable, routeMay, routeSeptember, lastAvailableDate);

            // Act
            var actual = await sut.GetAvailabilityMonths(from, to, 7);

            // Assert
            actual.Should().NotBeNull();
            actual.MonthsAvailability.Should().NotBeNull();
            actual.MonthsAvailability.Should().HaveCount(10);
            actual.MonthsAvailability.Should().HaveElementAt(0, new SingleMonthAvailability(DateTimeUtc.New(year, 01, 1), false));
            actual.MonthsAvailability.Should().HaveElementAt(1, new SingleMonthAvailability(DateTimeUtc.New(year, 02, 1), false));
            actual.MonthsAvailability.Should().HaveElementAt(2, new SingleMonthAvailability(DateTimeUtc.New(year, 03, 1), false));
            actual.MonthsAvailability.Should().HaveElementAt(3, new SingleMonthAvailability(DateTimeUtc.New(year, 04, 1), false));
            actual.MonthsAvailability.Should().HaveElementAt(4, new SingleMonthAvailability(DateTimeUtc.New(year, 05, 1), true));
            actual.MonthsAvailability.Should().HaveElementAt(5, new SingleMonthAvailability(DateTimeUtc.New(year, 06, 1), false));
            actual.MonthsAvailability.Should().HaveElementAt(6, new SingleMonthAvailability(DateTimeUtc.New(year, 07, 1), false));
            actual.MonthsAvailability.Should().HaveElementAt(7, new SingleMonthAvailability(DateTimeUtc.New(year, 08, 1), false));
            actual.MonthsAvailability.Should().HaveElementAt(8, new SingleMonthAvailability(DateTimeUtc.New(year, 09, 1), true));
            actual.MonthsAvailability.Should().HaveElementAt(9, new SingleMonthAvailability(DateTimeUtc.New(year, 10, 1), false));
            actual.LastAvailableDate.Should().Be(DateTimeUtc.New(year, 10, 1));
        }

        [Fact]
        public async Task GetAvailabilityMonths_DateAcrossTwoMonths()
        {
            // Arrange
            var from = "LGW";
            var to = "ES";
            var year = 2024;
            timeProviderMock.Setup(x => x.UtcNow).Returns(DateTimeUtc.New(year, 1, 1));
            destinationsSearchService
                .Setup(x => x.GetDestinationsByCodes(It.IsAny<string[]>(), It.IsAny<bool>()))
                .ReturnsAsync([GetSpain()]);

            SetupDirection("LGW", ["ACE"]);
            SetupDirection("ACE", ["LGW"]);

            var routeSeptember = GetStringItem("month", $"{year}-09", "departures", "30LGWACE");
            var routeOctober = GetStringItem("month", $"{year}-10", "departures", "07ACELGW");
            SetupDynamoQuery(DynamoDatesTable, routeSeptember, routeOctober);

            // Act
            var actual = await sut.GetAvailabilityMonths(from, to, 7);

            // Assert
            actual.Should().NotBeNull();
            actual.MonthsAvailability.Should().NotBeNull();
            actual.MonthsAvailability.Should().HaveElementAt(8, new SingleMonthAvailability(DateTimeUtc.New(year, 9, 1), true));
        }

        [Fact]
        public async Task GetAvailabilityMonths_DateAcrossTwoYears()
        {
            // Arrange
            var from = "LGW";
            var to = "ES";
            var year = 2024;
            timeProviderMock.Setup(x => x.UtcNow).Returns(DateTimeUtc.New(year, 1, 1));
            destinationsSearchService
                .Setup(x => x.GetDestinationsByCodes(It.IsAny<string[]>(), It.IsAny<bool>()))
                .ReturnsAsync([GetSpain()]);

            SetupDirection("LGW", ["ACE"]);
            SetupDirection("ACE", ["LGW"]);

            var routeDecember = GetStringItem("month", $"{year}-12", "departures", "31LGWACE");
            var routeJanuary = GetStringItem("month", $"{year + 1}-01", "departures", "07ACELGW");
            SetupDynamoQuery(DynamoDatesTable, routeDecember, routeJanuary);

            // Act
            var actual = await sut.GetAvailabilityMonths(from, to, 7);

            // Assert
            actual.Should().NotBeNull();
            actual.MonthsAvailability.Should().NotBeNull();
            actual.MonthsAvailability.Should().HaveElementAt(11, new SingleMonthAvailability(DateTimeUtc.New(year, 12, 1), true));
        }

        [Fact]
        public async Task GetAvailabilityMonths_DateInPast()
        {
            // Arrange
            var from = "LGW";
            var to = "ES";
            var year = 2024;
            timeProviderMock.Setup(x => x.UtcNow).Returns(DateTimeUtc.New(year, 2, 1));
            destinationsSearchService
                .Setup(x => x.GetDestinationsByCodes(It.IsAny<string[]>(), It.IsAny<bool>()))
                .ReturnsAsync([GetSpain()]);

            SetupDirection("LGW", ["ACE"]);
            SetupDirection("ACE", ["LGW"]);

            var routeJanuary = GetStringItem("month", $"{year}-01", "departures", "01LGWACE,08ACELGW");
            var lastAvailableDate = GetStringItem("month", $"{year}-10", "departures", $"01LGWACE");
            SetupDynamoQuery(DynamoDatesTable, routeJanuary, lastAvailableDate);

            // Act
            var actual = await sut.GetAvailabilityMonths(from, to, 7);

            // Assert
            actual.Should().NotBeNull();
            actual.MonthsAvailability.Should().NotBeNull();
            actual.MonthsAvailability.Should().AllSatisfy(x => x.Availability.Should().BeFalse());
        }

        private void SetupDirection(string keyValue, List<string> valueArray)
        {
            const string keyName = "departure";
            const string valueName = "arrivals";

            dynamoClient
                .Setup(x => x.GetItemAsync(It.Is<string>(s => s == DynamoRoutesToTable),
                    It.Is<Dictionary<string, AttributeValue>>(d => d.ContainsKey(keyName) && d[keyName].S == keyValue),
                    It.IsAny<bool>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new GetItemResponse
                {
                    Item = new Dictionary<string, AttributeValue>
                    {
                        {
                            keyName, new AttributeValue(keyValue)
                        },
                        {
                            valueName, new AttributeValue
                            {
                                SS = valueArray
                            }
                        }
                    }
                });
        }

        private void SetupDynamoQuery(string tableName, params Dictionary<string, AttributeValue>[] items)
        {
            dynamoClient
                .Setup(x => x.QueryAsync(
                    It.Is<QueryRequest>(sr => sr.TableName == tableName),
                    It.IsAny<CancellationToken>()))
                .ReturnsAsync(new QueryResponse
                {
                    Items = items.ToList()
                });
        }

        private Dictionary<string, AttributeValue> GetStringSetItem(string keyName, string keyValue, string valueName, List<string> valueArray)
        {
            return new Dictionary<string, AttributeValue>
            {
                { keyName, new AttributeValue(keyValue) },
                { valueName, new AttributeValue { SS = valueArray } }
            };
        }

        private Dictionary<string, AttributeValue> GetStringItem(string keyName, string keyValue, string valueName, string valueString)
        {
            return new Dictionary<string, AttributeValue>
            {
                { keyName, new AttributeValue(keyValue) },
                { valueName, new AttributeValue { S = valueString } }
            };
        }

        private DestinationItem GetSpain()
        {
            return new DestinationItem
            {
                Code = "ES",
                AirportCodes = new[]
                {
                    "ACE",
                    "BCN"
                },
                Available = true,
                Children =
                [
                    new DestinationItem
                    {
                        Code = "ESMJ",
                        Name = "Majorca",
                        Available = false,
                        Type = DestinationItemType.Region
                    },
                ],
                Name = "Spain",
                Type = DestinationItemType.Country,
                Parents = null
            };
        }

        private DestinationItem GetMajorca()
        {
            return new DestinationItem
            {
                Code = "ESMJ",
                AirportCodes = new[]
                {
                    "ACE",
                    "BCN"
                },
                Available = true,
                Children =
                [
                    new DestinationItem
                    {
                        Code = "X9000021",
                        Name = "Catalonia Majorca",
                        Available = false,
                        Type = DestinationItemType.Resort
                    },
                    new DestinationItem
                    {
                        Code = "ESMJAL",
                        Name = "Alcudia",
                        Available = false,
                        Type = DestinationItemType.Resort
                    },
                ],
                Name = "Majorca",
                Type = DestinationItemType.Region,
                Parents =
                [
                    new DestinationItem
                    {
                        Code = "ES",
                        Name = "Spain",
                        Available = false,
                        Type = DestinationItemType.Country
                    }
                ]
            };
        }

        private DestinationItem GetMajorcaHotel()
        {
            return new DestinationItem
            {
                Code = "X9000021",
                AirportCodes = new[]
                {
                    "ACE",
                    "BCN"
                },
                Available = true,
                Children = null,
                Name = "Catalonia Majorca",
                Type = DestinationItemType.Hotel,
                Parents =
                [
                    new DestinationItem
                    {
                        Code = "ESMJAL",
                        Name = "Alcudia",
                        Available = false,
                        Type = DestinationItemType.Resort
                    },
                    new DestinationItem
                    {
                        Code = "ESMJ",
                        Name = "Majorca",
                        Available = false,
                        Type = DestinationItemType.Region
                    },
                    new DestinationItem
                    {
                        Code = "ES",
                        Name = "Spain",
                        Available = false,
                        Type = DestinationItemType.Country
                    }
                ]
            };
        }
    }

    public class TestsData
    {
        public static IEnumerable<object[]> GetAvailabilityDates_From_Two_Airports_To_Hotel_Within_Range_Fixed =>
            new List<object[]>
            {
                new object[]
                {
                    "LGW,LTN",
                    "X9000021",
                    new DateTime(2019, 09, 29),
                    new DateTime(2019, 10, 30)
                }
            };

        public static IEnumerable<object[]> GetAvailability_From_Two_Airports_Within_Range_Flexible =>
            new List<object[]>
            {
                new object[]
                {
                    "LGW,LTN",
                    3,
                    new DateTime(2019, 09, 10),
                    new DateTime(2019, 09, 17)
                }
            };

        public static IEnumerable<object[]> GetAvailability_To_Region_Within_Range_Flexible =>
            new List<object[]>
            {
                new object[]
                {
                    "ES,ESMJ",
                    3,
                    new DateTime(2019, 09, 10),
                    new DateTime(2019, 09, 17)
                }
            };

        public static IEnumerable<object[]> GetAvailability_ToSameRegion =>
            new List<object[]>
            {
                new object[]
                {
                    "ESMJ",
                    3,
                    new DateTime(2019, 09, 10),
                    new DateTime(2019, 09, 17)
                }
            };

        public static IEnumerable<object[]> GetAvailability_To_Region_Within_Range_CrossMonths =>
            new List<object[]>
            {
                new object[]
                {
                    "ES,ESMJ",
                    null,
                    new DateTime(2019, 12, 28),
                    new DateTime(2020, 01, 04)
                },
                new object[]
                {
                    "ES,ESMJ",
                    null,
                    new DateTime(2019, 11, 28),
                    new DateTime(2019, 12, 03)
                }
            };

        public static IEnumerable<object[]> GetDepartureAvailability_Flexible =>
            new List<object[]>
            {
                new object[]
                {
                    "ES,ESMJ",
                    "LGW",
                    3,
                    new DateTime(2019, 09, 10),
                    new DateTime(2019, 09, 17),
                    7
                }
            };
    }
}
