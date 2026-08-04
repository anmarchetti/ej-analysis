using easyJet.Holidays.Api.Domain.Data.LivePrice;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Atcom.Models.Internal.Search;
using easyJet.Holidays.External.AWS.LivePriceSync.Models;
using easyJet.Holidays.External.AWS.LivePriceSync.Services;
using easyJet.Holidays.External.Cms.Models.Hotels.AllHotelCodes;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Models.LivePrice;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.AWS.LivePriceSync.Tests.Services;

public class LivePriceSettingsServiceTests
{
    private readonly Mock<IApiService> _apiService;
    private readonly LivePriceSettingsService _sut;

    public LivePriceSettingsServiceTests()
    {
        _apiService = new();
        Mock<ILogger<LivePriceSettingsService>> logger = new();
        CmsSettings settings = new()
        {
            Host = "http://some.host",
            Api = new()
            {
                GetLivePrice = "/testLivePrice",
                GetAllHotelCodes = "/testHotelCodes"
            }
        };

        _sut = new LivePriceSettingsService(_apiService.Object, logger.Object, Options.Create(settings));
    }

    #region ParseSettingsResponse
    [Fact]
    public void ParseSettingsResponse_InvalidSettings_ThrowException()
    {
        // Act
        Func<LivePriceConfiguration> noSettings = () => LivePriceSettingsService.ParseSettingsResponse(null);
        Func<LivePriceConfiguration> nullNamedSearch = () => LivePriceSettingsService.ParseSettingsResponse(new LivePriceSearchesResponseBody() { NamedSearches = null });
        Func<LivePriceConfiguration> emptyNamedSearch = () => LivePriceSettingsService.ParseSettingsResponse(new LivePriceSearchesResponseBody() { NamedSearches = new List<LivePriceSearch>() });

        // Assert
        noSettings.Should().Throw<InvalidOperationException>();
        nullNamedSearch.Should().Throw<InvalidOperationException>();
        emptyNamedSearch.Should().Throw<InvalidOperationException>();
    }

    [Fact]
    public void ParseSettingsResponse_MultipleCountriesAndDatesInPreviousYear_GroupPeriodsByCountries_Sort()
    {
        // Arrange
        var settings = new LivePriceSearchesResponseBody
        {
            NamedSearches = new List<LivePriceSearch> {
                new LivePriceSearch
                {
                    Name="beach",
                    NumberOfAdults = 2,
                    NumberOfChildren = 1,
                    NumberOfInfants = 1,
                    ChildAges = new List<string> { "5"},
                    DefaultDuration = 7,
                    ThemeTypesCodes = new List<string> { "B" },
                    Periods =  new List<DestinationSearch>
                    {
                        new DestinationSearch {
                            DestinationCodes = new List<string> { "ES" },
                            DateOfRun = new Period {
                                StartDate = new DateTimeOffset(2017, 10, 1, 0,0,0, TimeSpan.Zero),
                                EndDate = new DateTimeOffset(2017, 11, 1, 0,0,0, TimeSpan.Zero),
                            },
                            SearchDateRange = new Period {
                                StartDate = new DateTimeOffset(2015, 1, 1, 0,0,0, TimeSpan.Zero),
                                EndDate = new DateTimeOffset(2015, 2, 1, 0,0,0, TimeSpan.Zero),
                            },
                        },
                        new DestinationSearch {
                            DestinationCodes = new List<string>(),
                            DateOfRun = new Period {
                                StartDate = new DateTimeOffset(2017, 2, 1, 0,0,0, TimeSpan.Zero),
                                EndDate = new DateTimeOffset(2017, 3, 1, 0,0,0, TimeSpan.Zero),
                            },
                            SearchDateRange = new Period {
                                StartDate = new DateTimeOffset(2015, 1, 1, 0,0,0, TimeSpan.Zero),
                                EndDate = new DateTimeOffset(2015, 2, 1, 0,0,0, TimeSpan.Zero),
                            },
                        },
                        new DestinationSearch {
                            DestinationCodes = new List<string> { "ES" },
                            DateOfRun = new Period {
                                StartDate = new DateTimeOffset(2017, 2, 1, 0,0,0, TimeSpan.Zero),
                                EndDate = new DateTimeOffset(2017, 3, 1, 0,0,0, TimeSpan.Zero),
                            },
                            SearchDateRange = new Period {
                                StartDate = new DateTimeOffset(2025, 1, 1, 0,0,0, TimeSpan.Zero),
                                EndDate = new DateTimeOffset(2025, 2, 1, 0,0,0, TimeSpan.Zero),
                            },
                        }
                    }
                }
            }
        };

        // Act
        var result = LivePriceSettingsService.ParseSettingsResponse(settings);

        // Assert            
        // NamedSearches: can't compare objects, because Equals is overriden to check Id only
        var firstNS = result.NamedSearches[0].NamedSearch;
        firstNS.Name.Should().Be("beach");
        firstNS.Adults.Should().Be(2);
        firstNS.Children.Should().Be(1);
        firstNS.Infants.Should().Be(1);
        firstNS.ChildAges.Should().BeEquivalentTo(new List<string> { "5" });
        firstNS.Duration.Should().Be(7);
        firstNS.ThemeTypesCodes.Should().BeEquivalentTo(new List<string> { "B" });

        // Periods
        result.NamedSearches.ForEach(y => y.Schedule.Should().BeEquivalentTo(new List<DestinationSchedule> {
            new DestinationSchedule {
                CountryCodes = new List<string>(),
                Schedule = new List<ScheduleItem> {
                    new ScheduleItem {
                        DateOfRun = new DateRange {
                            Start = new DateTimeOffset(2017, 2, 1, 0,0,0, TimeSpan.Zero),
                            End = new DateTimeOffset(2017, 3, 1, 0,0,0, TimeSpan.Zero),
                        },
                        SearchDateRange = new DateRange {
                            Start = new DateTimeOffset(2015, 1, 1, 0,0,0, TimeSpan.Zero),
                            End = new DateTimeOffset(2015, 2, 1, 0,0,0, TimeSpan.Zero),
                        }
                    }
                }
            },
            new DestinationSchedule {
                CountryCodes = new List<string> { "ES" },
                Schedule = new List<ScheduleItem> {
                    new ScheduleItem {
                        DateOfRun = new DateRange {
                            Start = new DateTimeOffset(2017 , 2, 1, 0,0,0, TimeSpan.Zero),
                            End = new DateTimeOffset(2017, 3, 1, 0,0,0, TimeSpan.Zero),
                        },
                        SearchDateRange = new DateRange {
                            Start = new DateTimeOffset(2025, 1, 1, 0,0,0, TimeSpan.Zero),
                            End = new DateTimeOffset(2025, 2, 1, 0,0,0, TimeSpan.Zero),
                        }
                    },
                    new ScheduleItem {
                        DateOfRun = new DateRange {
                            Start = new DateTimeOffset(2017, 10, 1, 0,0,0, TimeSpan.Zero),
                            End = new DateTimeOffset(2017, 11, 1, 0,0,0, TimeSpan.Zero),
                        },
                        SearchDateRange = new DateRange {
                            Start = new DateTimeOffset(2015, 1, 1, 0,0,0, TimeSpan.Zero),
                            End = new DateTimeOffset(2015, 2, 1, 0,0,0, TimeSpan.Zero),
                        }
                    }
                }
            }
        }));
    }
    #endregion

    #region FilterOffers
    [Fact]
    public async Task FilterOffers_Filters_By_Id()
    {
        // Arrange
        var offers = new List<AvCacheResultOffersOffer> {
            new AvCacheResultOffersOffer {
                Accom = new[] {
                    new AvCacheResultOffersOfferAccom {
                        Code = "first"
                    }
                }
            },
            new AvCacheResultOffersOffer {
                Accom = new[] {
                    new AvCacheResultOffersOfferAccom {
                        Code = "second"
                    }
                }
            },
            new AvCacheResultOffersOffer {
                Accom = new[] {
                    new AvCacheResultOffersOfferAccom {
                        Code = "third"
                    }
                }
            },
            new AvCacheResultOffersOffer {
                Accom = new[] {
                    new AvCacheResultOffersOfferAccom {
                        Code = "second"
                    }
                }
            },
            new AvCacheResultOffersOffer {
                Accom = new[] {
                    new AvCacheResultOffersOfferAccom {
                        Code = "fourth"
                    }
                }
            }
        };

        _apiService.Setup(x => x.GetResponseContentAsync<AllHotelCodesRequest, AllHotelCodesResponse>(
                It.IsAny<AllHotelCodesRequest>()))
            .ReturnsAsync(new AllHotelCodesResponse
            {
                Payload = new ()
                {
                    Body = ["first", "SECOND", "third"]
                }
            });

        // Act
        var result = await _sut.ExcludeOffersThatAreNotInCms(offers, "en");

        // Assert
        result.Should().BeEquivalentTo(new List<AvCacheResultOffersOffer> {
            new AvCacheResultOffersOffer {
                Accom = new[] {
                    new AvCacheResultOffersOfferAccom {
                        Code = "first"
                    }
                }
            },
            new AvCacheResultOffersOffer {
                Accom = new[] {
                    new AvCacheResultOffersOfferAccom {
                        Code = "third"
                    }
                }
            }
        });
    }
    #endregion

    #region GetSettings

    [Fact]
    public async Task GetSettings_ReturnsMarketSettings()
    {
        // Arrange
        var sitecoreResponse = ValidLivePriceSettingsResponse;

        _apiService
            .Setup(x => x.GetResponseContentAsync<LivePriceSettingsRequest, LivePriceSettingsResponse>(It.IsAny<LivePriceSettingsRequest>()))
            .ReturnsAsync(sitecoreResponse);

        // Act
        var settings = await _sut.GetSettings(
            new MarketSettings { Code = "UK", Currency = Currency.GBP },
            new LanguageSettings { MarketLanguages = new Dictionary<string, IEnumerable<string>> { { "UK", new[] { "en" } } } });

        // Assert
        settings.Should().NotBeNull();
        settings.MarketCode.Should().Be("UK");
        settings.Currency.Should().Be(Currency.GBP.Code);

        foreach (var config in settings.NamedSearches)
        {
            var search = config.NamedSearch;
            var expected = sitecoreResponse.Payload.Body.NamedSearches.Single(x => x.Name == search.Name);

            VerifyNamedSearch(search, expected);
        }
    }

    [Fact]
    public async Task GetSettings_MultiLanguageMarket_ReturnsSettingsForEachLanguage()
    {
        // Arrange
        var sitecoreResponse = ValidLivePriceSettingsResponse;

        _apiService
            .Setup(x => x.GetResponseContentAsync<LivePriceSettingsRequest, LivePriceSettingsResponse>(It.IsAny<LivePriceSettingsRequest>()))
            .ReturnsAsync(sitecoreResponse);

        // Act
        var settings = await _sut.GetSettings(
            new MarketSettings { Code = "CH", Currency = Currency.CHF },
            new LanguageSettings { MarketLanguages = new Dictionary<string, IEnumerable<string>> { { "CH", new[] { "fr-CH", "de-CH" } } } });

        // Arrange
        settings.Should().NotBeNull();
        settings.NamedSearches.Should().NotBeNull();
        settings.NamedSearches.Count.Should().Be(2);
        settings.NamedSearches.Count(x => x.NamedSearch.Language == "fr-CH").Should().Be(1);
        settings.NamedSearches.Count(x => x.NamedSearch.Language == "de-CH").Should().Be(1);

        foreach (var config in settings.NamedSearches)
        {
            var search = config.NamedSearch;
            var expected = sitecoreResponse.Payload.Body.NamedSearches.Single(x => x.Name == search.Name);

            VerifyNamedSearch(search, expected);
        }
    }

    private static void VerifyNamedSearch(NamedSearch search, LivePriceSearch expected)
    {
        search.Adults.Should().Be(expected.NumberOfAdults);
        search.Children.Should().Be(expected.NumberOfChildren);
        search.Infants.Should().Be(expected.NumberOfInfants);
        search.Duration.Should().Be(expected.DefaultDuration);
        search.ChildAges.Should().BeEquivalentTo(expected.ChildAges);
        search.ThemeTypesCodes.Should().BeEquivalentTo(expected.ThemeTypesCodes);
    }

    #endregion

    private static LivePriceSettingsResponse ValidLivePriceSettingsResponse => new LivePriceSettingsResponse
    {
        Payload = new ()
        {
            Body = new LivePriceSearchesResponseBody
            {
                NamedSearches = new List<LivePriceSearch> {
                    new LivePriceSearch
                    {
                        Name="beach",
                        NumberOfAdults = 2,
                        NumberOfChildren = 1,
                        NumberOfInfants = 1,
                        ChildAges = new List<string> { "5"},
                        DefaultDuration = 7,
                        ThemeTypesCodes = new List<string> { "B" },
                        Periods =  new List<DestinationSearch>
                        {
                            new DestinationSearch {
                                DestinationCodes = new List<string> { "ES" },
                                DateOfRun = new Period {
                                    StartDate = new DateTimeOffset(2017, 2, 1, 0,0,0, TimeSpan.Zero),
                                    EndDate = new DateTimeOffset(2017, 3, 1, 0,0,0, TimeSpan.Zero),
                                },
                                SearchDateRange = new Period {
                                    StartDate = new DateTimeOffset(2025, 1, 1, 0,0,0, TimeSpan.Zero),
                                    EndDate = new DateTimeOffset(2025, 2, 1, 0,0,0, TimeSpan.Zero),
                                },
                            }
                        }
                    }
                }
            }
        }
    };
}