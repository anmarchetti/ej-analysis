using easyJet.Holidays.Api.Domain.Data.Common;
using easyJet.Holidays.Api.Domain.Data.Hotels;
using easyJet.Holidays.Api.Domain.Data.RequestedPrice;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Services.Market;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.AWS.Models.RequestedPrice;
using easyJet.Holidays.External.AWS.RequestedPriceSync.Services;
using easyJet.Holidays.External.DataHub.SoapReference;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Models.Api.Payload;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.AWS.RequestedPriceSync.Tests.Services;

public class RequestedPriceCmsConnectorTests
{
    private readonly Mock<IApiService> _apiService;
    private readonly RequestedPriceCmsConnector _sut;
    private Mock<IMarketService> _marketService;

    public RequestedPriceCmsConnectorTests()
    {
        _apiService = new();
        _marketService = new();

        var logger = new Mock<ILogger<RequestedPriceCmsConnector>>();

        var settings = new CmsSettings()
        {
            Host = "http://some.test",
            Api = new()
            {
                RequestedSearches = "requestedSearchesTest"
            }
        };

        _sut = new RequestedPriceCmsConnector(_apiService.Object, _marketService.Object, logger.Object, Options.Create(settings));
    }

    public static TheoryData<RequestedPriceSettingsResponseBody> EmptyResponses =
    [
        null!,
        new RequestedPriceSettingsResponseBody(){RequestedSearches = []}
    ];

    [Theory]
    [MemberData(nameof(EmptyResponses))]
    public async Task GetConfig_WhenResponseDoesNotContainNamedSearches_ReturnsNull(RequestedPriceSettingsResponseBody response)
    {
        // Arrange
        _marketService.Setup(mock => mock.GetMarketByLanguageCode(It.IsAny<string>()))
            .Returns(new MarketSettings() { Code = "TEST" });

        _apiService.Setup(mock =>
            mock.GetResponseContentAsync<RequestedPriceSettingsRequest, RequestedPriceSettingsResponse>(
                It.IsAny<RequestedPriceSettingsRequest>())).ReturnsAsync(
            new RequestedPriceSettingsResponse()
            {
                Payload = new JsonApiPayload<RequestedPriceSettingsResponseBody>() { Body = response }
            });

        // Act
        var result = await _sut.GetConfig("someMarketLanguage");

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task GetConfig_ForValidResponse_ParsesConfigCorrectly()
    {
        // Arrange
        var settings = new RequestedPriceSettingsResponseBody
        {
            RequestedSearches = new NamedSearchResponse[2] {
                new NamedSearchResponse
                {
                    Name="beach",
                    NumberOfAdults = 2,
                    NumberOfChildren = 1,
                    NumberOfInfants = 1,
                    ChildAges = new List<string> { "5"},
                    DefaultDuration = 7,
                    ThemeTypesCodes = new List<string> { "B" },
                    Destinations = new List<string> { "ES" },
                    Periods =  new List<PeriodByDestinationResponse>
                    {
                        new PeriodByDestinationResponse {
                           DateOfRun = new PeriodResponse {
                                StartDate = new DateTime(2017, 10, 1, 0,0,0),
                                EndDate = new DateTime(2017, 11, 1, 0,0,0),
                            },
                            SearchDateRange = new PeriodResponse {
                                StartDate = new DateTime(2015, 1, 1, 0,0,0),
                                EndDate = new DateTime(2015, 2, 1, 0,0,0),
                            },
                        },
                        new PeriodByDestinationResponse {
                          DateOfRun = new PeriodResponse {
                                StartDate = new DateTime(2017, 2, 1, 0,0,0),
                                EndDate = new DateTime(2017, 3, 1, 0,0,0),
                            },
                            SearchDateRange = new PeriodResponse {
                                StartDate = new DateTime(2015, 1, 1, 0,0,0),
                                EndDate = new DateTime(2015, 2, 1, 0,0,0),
                            },
                        },
                        new PeriodByDestinationResponse {
                          DateOfRun = new PeriodResponse {
                                StartDate = new DateTime(2017, 2, 1, 0,0,0),
                                EndDate = new DateTime(2017, 3, 1, 0,0,0),
                            },
                            SearchDateRange = new PeriodResponse {
                                StartDate = new DateTime(2025, 1, 1, 0,0,0),
                                EndDate = new DateTime(2025, 2, 1, 0,0,0),
                            },
                        }
                    },
                    DiscountAmountMax = 0,
                    DiscountAmountMin = 0,
                    TripAdvisorRating = 3,
                    IsFlexibleDatesRange = false,
                    DiscountOnly = false,
                    DiscountPercentsMax = 0,
                    DiscountPercentsMin = 0,
                    MaxPPPrice = 0,
                    MaxTotalPrice = 0,
                    MinPPPrice = 0,
                    MinTotalPrice = 0,
                    BoardTypes = new List<string> { "AU"},
                    FacilityTypes = new List<Facility> { new Facility { Code = "test", Name = "test", FacilityFilterGroup = new FacilityFilterGroup {
                        Code = "test", Name = "test", ParentCode = "test", ParentName = "test"} } },
                    Origin = new List<string> { "EDI"},
                    Url = new Uri("http://test.com/"),
                    StarRating = ["5"]
                },
                new NamedSearchResponse
                {
                    Name="beach",
                    NumberOfAdults = 2,
                    NumberOfChildren = 1,
                    NumberOfInfants = 1,
                    ChildAges = new List<string> { "5"},
                    DefaultDuration = 7,
                    ThemeTypesCodes = new List<string> { "B" },
                    Destinations = new List<string> { "ES" },
                    Periods =  new List<PeriodByDestinationResponse>
                    {
                        new PeriodByDestinationResponse {
                           DateOfRun = new PeriodResponse {
                                StartDate = new DateTime(2017, 10, 1, 0,0,0),
                                EndDate = new DateTime(2017, 11, 1, 0,0,0),
                            },
                            SearchDateRange = new PeriodResponse {
                                StartDate = new DateTime(2015, 1, 1, 0,0,0),
                                EndDate = new DateTime(2015, 2, 1, 0,0,0),
                            },
                        },
                        new PeriodByDestinationResponse {
                           DateOfRun = new PeriodResponse {
                                StartDate = new DateTime(2017, 2, 1, 0,0,0),
                                EndDate = new DateTime(2017, 3, 1, 0,0,0),
                            },
                            SearchDateRange = new PeriodResponse {
                                StartDate = new DateTime(2015, 1, 1, 0,0,0),
                                EndDate = new DateTime(2015, 2, 1, 0,0,0),
                            },
                        },
                        new PeriodByDestinationResponse {
                           DateOfRun = new PeriodResponse {
                                StartDate = new DateTime(2017, 2, 1, 0,0,0),
                                EndDate = new DateTime(2017, 3, 1, 0,0,0),
                            },
                            SearchDateRange = new PeriodResponse {
                                StartDate = new DateTime(2025, 1, 1, 0,0,0),
                                EndDate = new DateTime(2025, 2, 1, 0,0,0),
                            },
                        }
                    },
                    DiscountAmountMax = 0,
                    DiscountAmountMin = 0,
                    TripAdvisorRating = 3,
                    IsFlexibleDatesRange = false,
                    DiscountOnly = false,
                    DiscountPercentsMax = 0,
                    DiscountPercentsMin = 0,
                    MaxPPPrice = 0,
                    MaxTotalPrice = 0,
                    MinPPPrice = 0,
                    MinTotalPrice = 0,
                    BoardTypes = new List<string> { "AU"},
                    FacilityTypes = new List<Facility> { new Facility { Code = "test", Name = "test", FacilityFilterGroup = new FacilityFilterGroup {
                        Code = "test", Name = "test", ParentCode = "test", ParentName = "test"} } },
                    Origin = [], // leaving empty to ensure it gets filled from market
                    Url = new Uri("http://test.com/"),
                    StarRating = ["5"]
                }
            },
        };

        _apiService.Setup(
            mock => mock.GetResponseContentAsync<RequestedPriceSettingsRequest, RequestedPriceSettingsResponse>(It.IsAny<RequestedPriceSettingsRequest>())
        ).ReturnsAsync(
            new RequestedPriceSettingsResponse()
            {
                Payload = new JsonApiPayload<RequestedPriceSettingsResponseBody>() { Body = settings }
            }
        );

        const string code = "TEST";
        const string lang = "testingLang";
        const string currency = "usd";
        var someAirports = new HashSet<string>() { "a1, a2" };
        _marketService.Setup(mock => mock.GetMarketByLanguageCode(It.IsAny<string>()))
            .Returns(new MarketSettings()
            {
                Code = code,
                MasterLanguage = lang,
                Currency = new(){Code = currency},
                AirportDepartureCodes = someAirports
            });

        // Act
        var result = await _sut.GetConfig(lang);

        // Assert
        result.Should().NotBeNull();
        result.NamedSearches.Should().NotBeNullOrEmpty();
        result.NamedSearches.All(search => search is
        {
            NamedSearch:
            {
                Currency:currency, 
                MarketCode:code, 
                MarketLanguage:lang
            }
        }).Should().BeTrue();

        // ensuring it got filled from market
        result.NamedSearches.Last().NamedSearch.Origin.Should().ContainInOrder(someAirports);
    }

    #region GetSearchRange
    [Fact]
    public void GetSearchRange_DateIsInRangeButTimeIsNot_ReturnRangeIgnoringTime()
    {
        // Arrange
        var now = new DateTime(2020, 1, 5, 23, 0, 0);
        var period = new DestinationSchedule
        {
            Schedule = new List<ScheduleItem>
            {
                new ScheduleItem
                {
                    DateOfRun = new DateRange {
                        Start = new DateTime(2020, 1, 1, 0,0,0),
                        End = new DateTime(2020, 1, 5, 0,0,0)
                    },
                    SearchDateRange = new DateRange {
                        Start = new DateTime(2020, 5, 5, 0,0,0),
                        End = new DateTime(2020, 7, 15, 0,0,0)
                    }
                }
            }
        };

        // Act
        var result = RequestedPriceCmsConnector.GetSearchRange(now, period);

        // Assert
        result.Should().BeEquivalentTo(new DateRange
        {
            Start = new DateTime(2020, 5, 5, 0, 0, 0),
            End = new DateTime(2020, 7, 15, 0, 0, 0)
        });

    }

    [Fact]
    public void GetSearchRange_StartDateLessNow_ReturnsSearchDateRangeWithStartDateEquivalentToDateNow()
    {
        // Arrange
        var now = new DateTime(2021, 10, 1, 0, 0, 0);
        var period = new DestinationSchedule
        {
            Schedule = new List<ScheduleItem>
            {
                new ScheduleItem
                {
                    DateOfRun = new DateRange {
                        Start = new DateTime(2020, 1, 1, 0,0,0),
                        End = new DateTime(2020, 1, 5, 0,0,0)
                    },
                    SearchDateRange = new DateRange {
                        Start = new DateTime(2021, 5, 1, 0,0,0),
                        End = new DateTime(2021, 11, 15, 0,0,0)
                    }
                }
            }
        };

        // Act
        var result = RequestedPriceCmsConnector.GetSearchRange(now, period);

        // Assert
        result.Should().BeEquivalentTo(new DateRange
        {
            Start = now,
            End = new DateTime(2021, 11, 15, 0, 0, 0)
        });
    }

    [Fact]
    public void GetSearchRange_NowBeforeEarliestRange_ReturnsNull()
    {
        // Arrange
        var now = new DateTime(2020, 1, 5, 23, 0, 0);
        var period = new DestinationSchedule
        {
            Schedule = new List<ScheduleItem>
            {
                new ScheduleItem
                {
                      DateOfRun = new DateRange {
                        Start = new DateTime(2020, 1, 6, 0,0,0),
                        End = new DateTime(2020, 1, 8, 0,0,0)
                    },
                    SearchDateRange = new DateRange {
                        Start = new DateTime(2020, 5, 1, 0,0,0),
                        End = new DateTime(2020, 7, 15, 0,0,0)
                    }
                }
            }
        };

        // Act
        var result = RequestedPriceCmsConnector.GetSearchRange(now, period);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public void GetSearchRange_NowAfterRangeEnd_ReturnsRange()
    {
        // Arrange
        var now = new DateTime(2020, 1, 15, 0, 0, 0);
        var period = new DestinationSchedule
        {
            Schedule = new List<ScheduleItem>
            {
                new ScheduleItem
                {
                  DateOfRun = new DateRange {
                        Start = new DateTime(2020, 1, 6, 0,0,0),
                        End = new DateTime(2020, 1, 8, 0,0,0)
                    },
                    SearchDateRange = new DateRange {
                        Start = new DateTime(2020, 5, 1, 0,0,0),
                        End = new DateTime(2020, 7, 15, 0,0,0)
                    }
                }
            }
        };

        // Act
        var result = RequestedPriceCmsConnector.GetSearchRange(now, period);

        // Assert
        result.Should().BeEquivalentTo(new DateRange
        {
            Start = new DateTime(2020, 5, 1, 0, 0, 0),
            End = new DateTime(2020, 7, 15, 0, 0, 0)
        });
    }

    [Fact]
    public void GetSearchRange_ScheduleIsNull_ReturnsNull()
    {
        // Arrange
        var now = new DateTime(2020, 1, 15, 0, 0, 0);
        var period = new DestinationSchedule
        {
            Schedule = null
        };

        // Act
        var result = RequestedPriceCmsConnector.GetSearchRange(now, period);

        // Assert
        result.Should().BeNull();
    }
    #endregion

    #region ParseSettingsResponse
    [Fact]
    public void ParseSettingsResponse_InvalidSettings_ThrowException()
    {
        // Act
        Func<RequestedPriceConfiguration> noSettings = () => RequestedPriceCmsConnector.ParseSettingsResponse(null);
        Func<RequestedPriceConfiguration> nullNamedSearch = () => RequestedPriceCmsConnector.ParseSettingsResponse(new RequestedPriceSettingsResponseBody() { RequestedSearches = null });
        Func<RequestedPriceConfiguration> emptyNamedSearch = () => RequestedPriceCmsConnector.ParseSettingsResponse(new RequestedPriceSettingsResponseBody() { RequestedSearches = Array.Empty<NamedSearchResponse>() });

        // Assert
        noSettings.Should().Throw<ArgumentOutOfRangeException>();
        nullNamedSearch.Should().Throw<InvalidOperationException>();
        emptyNamedSearch.Should().Throw<InvalidOperationException>();
    }
    [Fact]
    public void ParseSettingsResponse_MultipleCountriesAndDatesInPreviousYear_GroupPeriodsByCountries_Sort()
    {
        // Arrange
        var settings = new RequestedPriceSettingsResponseBody
        {
            RequestedSearches = new NamedSearchResponse[1] {
                new NamedSearchResponse
                {
                    Name="beach",
                    NumberOfAdults = 2,
                    NumberOfChildren = 1,
                    NumberOfInfants = 1,
                    ChildAges = new List<string> { "5"},
                    DefaultDuration = 7,
                    ThemeTypesCodes = new List<string> { "B" },
                    Destinations = new List<string> { "ES" },
                    Periods =  new List<PeriodByDestinationResponse>
                    {
                        new PeriodByDestinationResponse {
                            DateOfRun = new PeriodResponse {
                                StartDate = new DateTime(2017, 10, 1, 0,0,0),
                                EndDate = new DateTime(2017, 11, 1, 0,0,0),
                            },
                            SearchDateRange = new PeriodResponse {
                                StartDate = new DateTime(2015, 1, 1, 0,0,0),
                                EndDate = new DateTime(2015, 2, 1, 0,0,0),
                            },
                        },
                        new PeriodByDestinationResponse {
                            DateOfRun = new PeriodResponse {
                                StartDate = new DateTime(2017, 2, 1, 0,0,0),
                                EndDate = new DateTime(2017, 3, 1, 0,0,0),
                            },
                            SearchDateRange = new PeriodResponse {
                                StartDate = new DateTime(2015, 1, 1, 0,0,0),
                                EndDate = new DateTime(2015, 2, 1, 0,0,0),
                            },
                        },
                        new PeriodByDestinationResponse {
                            DateOfRun = new PeriodResponse {
                                StartDate = new DateTime(2017, 2, 1, 0,0,0),
                                EndDate = new DateTime(2017, 3, 1, 0,0,0),
                            },
                            SearchDateRange = new PeriodResponse {
                                StartDate = new DateTime(2025, 1, 1, 0,0,0),
                                EndDate = new DateTime(2025, 2, 1, 0,0,0),
                            },
                        }
                    },
                    DiscountAmountMax = 0,
                    DiscountAmountMin = 0,
                    TripAdvisorRating = 3,
                    IsFlexibleDatesRange = false,
                    DiscountOnly = false,
                    DiscountPercentsMax = 0,
                    DiscountPercentsMin = 0,
                    MaxPPPrice = 0,
                    MaxTotalPrice = 0,
                    MinPPPrice = 0,
                    MinTotalPrice = 0,
                    BoardTypes = new List<string> { "AU"},
                    FacilityTypes = new List<Facility> { new Facility { Code = "test", Name = "test", FacilityFilterGroup = new FacilityFilterGroup {
                        Code = "test", Name = "test", ParentCode = "test", ParentName = "test"} } },
                    Origin = new List<string> { "EDI"},
                    Url = new Uri("http://test.com/"),
                    StarRating = ["5"]
                }
            },
        };
        // Act
        var result = RequestedPriceCmsConnector.ParseSettingsResponse(settings);

        // Assert            
        // NamedSearches: can't compar objects, because Equals is overriden to check Id only
        result.NamedSearches.Count().Should().Be(1);
        var firstNS = result.NamedSearches.First().NamedSearch;
        firstNS.Id.Should().Be("beach");
        firstNS.Adults.Should().Be(2);
        firstNS.Children.Should().Be(1);
        firstNS.Infants.Should().Be(1);
        firstNS.ChildAges.Should().BeEquivalentTo(new List<string> { "5" });
        firstNS.Duration.Should().Be(7);
        firstNS.ThemeTypesCodes.Should().BeEquivalentTo(new List<string> { "B" });
        firstNS.Destinations.Should().BeEquivalentTo(new List<string> { "ES" });
        firstNS.DiscountAmountMax.Should().Be(0);
        firstNS.DiscountAmountMin.Should().Be(0);
        firstNS.TripAdvisorRating.Should().Be(3);
        firstNS.IsFlexibleDatesRange.Should().Be(false);
        firstNS.DiscountOnly.Should().Be(false);
        firstNS.DiscountPercentsMax.Should().Be(0);
        firstNS.DiscountPercentsMin.Should().Be(0);
        firstNS.MaxPPPrice.Should().Be(0);
        firstNS.MaxTotalPrice.Should().Be(0);
        firstNS.MinPPPrice.Should().Be(0);
        firstNS.MinTotalPrice.Should().Be(0);
        firstNS.BoardTypes.Should().BeEquivalentTo(new List<string> { "AU" });
        firstNS.Origin.Should().BeEquivalentTo(new List<string> { "EDI" });
        firstNS.Url.Should().Be("http://test.com/");
        firstNS.StarRating.Should().BeEquivalentTo(new List<string> { "5" });

        // Periods
        var expectedResult = new List<DestinationSchedule> {
            new DestinationSchedule {
                Destinations = new List<string> { "ES" },
                Schedule = new List<ScheduleItem> {
                    new ScheduleItem {
                          DateOfRun = new DateRange {
                            Start = new DateTime(2017, 2, 1, 0,0,0),
                            End = new DateTime(2017, 3, 1, 0,0,0),
                        },
                        SearchDateRange = new DateRange {
                            Start = new DateTime(2015, 1, 1, 0,0,0),
                            End = new DateTime(2015, 2, 1, 0,0,0),
                        }
                    },
                    new ScheduleItem {
                        DateOfRun = new DateRange {
                            Start = new DateTime(2017 , 2, 1, 0,0,0),
                            End = new DateTime(2017, 3, 1, 0,0,0),
                        },
                        SearchDateRange = new DateRange {
                            Start = new DateTime(2025, 1, 1, 0,0,0),
                            End = new DateTime(2025, 2, 1, 0,0,0),
                        }
                    },
                    new ScheduleItem {
                           DateOfRun = new DateRange {
                            Start = new DateTime(2017, 10, 1, 0,0,0),
                            End = new DateTime(2017, 11, 1, 0,0,0),
                        },
                        SearchDateRange = new DateRange {
                            Start = new DateTime(2015, 1, 1, 0,0,0),
                            End = new DateTime(2015, 2, 1, 0,0,0),
                        }
                    }
                }
            }
        };
        result.NamedSearches.First().Schedule.Should().BeEquivalentTo(expectedResult);
    }
    #endregion
}