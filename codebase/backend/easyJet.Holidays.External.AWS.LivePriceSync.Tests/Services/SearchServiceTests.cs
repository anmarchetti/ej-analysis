using Amazon.Lambda.Core;
using easyJet.Holidays.Api.Domain.Data.LivePrice;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Interfaces.Cms;
using easyJet.Holidays.Api.Domain.Services.Cookies;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Atcom.Models.Internal.Search;
using easyJet.Holidays.External.Atcom.Models.Search;
using easyJet.Holidays.External.AWS.LivePriceSync.Services;
using easyJet.Holidays.External.AWS.Logging;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Services;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Moq;
using System.Collections.ObjectModel;
using Xunit;

namespace easyJet.Holidays.External.AWS.LivePriceSync.Tests.Services;

public class SearchServiceTests
{
    private readonly Mock<IApiService> _apiService;

    private readonly Mock<IReferenceDataService> _referenceDataService;
    private readonly Mock<ILambdaLogger> _logger = new();

    private readonly SearchService _sut;

    public SearchServiceTests()
    {
        _referenceDataService = new();
        _apiService = new();
        var envSettings = Options.Create(new EnvironmentBehaviourSettings
        {
            Performance = new PerformanceSettings
            {
                UseDisposableHttpClient = false,
                FacilitiesFilterDisabled = true
            },
            MaxConnectionsPerServer = 1024,
        });

        var atcomSettings = Options.Create(new AtcomSettings()
        {
            TimeoutMilliSeconds = 100000,
            Booking = new AtcomApiSettings // setting dummy data, since it is required for endpoints service to setup, but is not used for searching
            {
                Host = "https://fake-host.com",
                BaseUrl = "/fake_section"
            },
            Search = new()
            {
                Uk = new()
                {
                    Host = "http://search-domain",
                    BaseUrl = "api/searchuk",
                },
                Ch = new()
                {
                    Host = "http://search-domain",
                    BaseUrl = "api/searchch",
                },
                De = new()
                {
                    Host = "http://search-domain",
                    BaseUrl = "api/searchde",
                },
                Fr = new()
                {
                    Host = "http://search-domain",
                    BaseUrl = "api/searchfr",
                }
            },
            MarketBrands = new Dictionary<string, MarketBrands>()
            {
                {"default", new () { Brands = new() { { "UK", "F" } } }}
            },
            EndpointTemplate = new AtcomEndpointTemplateSettings
            {
                Search = "s_tp=3&h_tp=P&tpf=Y&direct=N&names=1&fc_pp=N&cty=1&{0}",
                BrandParam = "brnd={0}"
            },
            RoomSystemsSettings = new RoomSystemsSettings()
            {
                Priorities = new Dictionary<string, int>()
                {
                    {"TGX", 0},
                    {"Static", 1},
                },
                SystemToDiscard = "HB3"
            }
        });

        var cacheSettings = Options.Create(new CacheSettings
        {
            Buckets = new Buckets
                { FacilitiesCache = "FacilitiesCache", CMSReferenceData = "Cms", SearchCache = "SearchCache" }
        });

        var cookiesSettings = Options.Create(new CookiesSettings());

        var cookiesService = new CookiesService(cookiesSettings);

        var atcomEndpointsProvider = new Atcom.Services.EndpointsProvider(
            atcomSettings,
            envSettings,
            cookiesService,
            new LambaLogger<Atcom.Services.EndpointsProvider>(_logger.Object)
        );

        var languageSettings = Options.Create(new LanguageSettings
        {
            MarketMasterLanguageMap = new Dictionary<string, string> { { "UK", "en" } },
            MarketLanguages = new Dictionary<string, IEnumerable<string>> { { "UK", new[] { "en" } } },
            DefaultLanguage = "en"
        });

        var searchSettings = Options.Create(new SearchSettings()
        {
            DefaultFlexibleDays = 3,
            SerchTypes = new List<SearchType>() { new() { Key = "Normal", Value = "S" } }
        });
        Mock<ISettingsService> settingsService = new();
        var smartSeerSettings = Options.Create(new SmartSeerSettings());

        settingsService.Setup(x => x.GetAllMarketSettings()).ReturnsAsync(new Dictionary<string, MarketSettings>()
        {
            {
                "UK", new MarketSettings()
                {
                    AirportDepartureCodes = new HashSet<string> {"LTN", "LGW"},
                    Code = "UK",
                    CountryCode = "GB",
                    Currency = new Currency
                    {
                        Code = "GBP"
                    },
                    MasterLanguage = "en",
                    AtcomBrandCode = "F"
                }
            }
        });

        var serviceBuilder = new SearchServiceBuilder(settingsService.Object, atcomSettings, cacheSettings, envSettings, languageSettings, searchSettings, smartSeerSettings);
        _sut = serviceBuilder.Build("UK", _referenceDataService.Object, atcomEndpointsProvider,
            _apiService.Object, _logger.Object);
        //_sut = new SearchService(_apiService.Object, referenceDataService.Object, new Uri("https://test"), "{0}", _fixture.Freeze<ILambdaLogger>());
        //_sut.SetPrivateProperty("_service", _apiService.Object);
    }

    [Fact]
    public async Task DoSearch_BuildCorrectQuery()
    {
        // Arrange
        var namedSearch = new NamedSearch
        {
            Name = "test",
            Adults = 2,
            Children = 1,
            ChildAges = new List<string> { "5", "7" },
            Duration = 4,
            Infants = 1,
            ThemeTypesCodes = new List<string> { "C" },
        };
        var dateRange = new DateRange
        {
            Start = new DateTimeOffset(2023, 10, 12, 10, 0, 0, TimeSpan.Zero),
            End = new DateTimeOffset(2023, 11, 5, 10, 0, 0, TimeSpan.Zero),
        };
        _apiService.Setup(x => x.GetResponseContentAsync<SearchAvailablePackagesRequest, SearchAvailablePackagesResponse>(It.IsAny<SearchAvailablePackagesRequest>()
        )).ReturnsAsync(new SearchAvailablePackagesResponse
        {
            Payload = new ()
            {
                Body = null
            }
        });

        _referenceDataService.Setup(service => service.GetPriceLimit()).ReturnsAsync(new PriceLimitSettings()
        {
            IsPricePerPerson = true,
            MaxPrice = 5000,
            MinPrice = 100
        });

        // Act
        _ = await _sut.DoSearch(namedSearch, new[] { "ES", "PT" }, dateRange, "LGW", "UK");

        // Assert
        _apiService.Verify(x => x.GetResponseContentAsync<SearchAvailablePackagesRequest, SearchAvailablePackagesResponse>(It.Is<SearchAvailablePackagesRequest>(
            request => request.QueryParams == "s_tp=3&h_tp=P&tpf=Y&direct=N&names=1&fc_pp=N&cty=1&sdate=2023-10-12&edate=2023-11-05&stay=4&dep=LGW&pax_ad=2&pax_ch=1&pax_in=1&ch_age=5,7&rooms=1&geog=ES%7cPT&p_tp=PP&max_prc=5000&min_prc=100&dc=N&rm_1=1,2,3,4&brnd=F"
        )), Times.Once);
    }

    [Fact]
    public async Task DoSearch_FilterResponseByTheme_BuildQueryAndFilterByTheme()
    {
        // Arrange
        var namedSearch = new NamedSearch
        {
            Name = "test",
            Adults = 2,
            Children = 1,
            ChildAges = new List<string> { "5,7" },
            Duration = 4,
            Infants = 1,
            ThemeTypesCodes = new List<string> { "C" }
        };
        var dateRange = new DateRange
        {
            Start = new DateTimeOffset(2020, 10, 12, 10, 0, 0, TimeSpan.Zero),
            End = new DateTimeOffset(2020, 11, 5, 10, 0, 0, TimeSpan.Zero),
        };

        _referenceDataService.Setup(x => x.GetAccommodationToGiataMappings(It.IsAny<IEnumerable<string>>()))
            .ReturnsAsync(new Dictionary<string, string>
            {
                {"1", "1111111"},
                {"2", "2222222"}
            });

        _apiService.Setup(x => x.GetResponseContentAsync<SearchAvailablePackagesRequest, SearchAvailablePackagesResponse>(It.IsAny<SearchAvailablePackagesRequest>()
        )).ReturnsAsync(new SearchAvailablePackagesResponse
        {
            Payload = new ()
            {
                Body = new AvCache
                {
                    Result = new AvCacheResult
                    {
                        Offers = new AvCacheResultOffers
                        {
                            Offer = new[] {
                                new AvCacheResultOffersOffer
                                {
                                    Accom = new[] {
                                        new AvCacheResultOffersOfferAccom {
                                            Code = "1",
                                            Prom = "xxBd",
                                            Unit = new []
                                            {
                                                new AvCacheResultOffersOfferAccomUnit
                                                {
                                                    Occ = new AvCacheResultOffersOfferAccomUnitOcc
                                                    {
                                                        Ad = 2,
                                                        Ch = 1
                                                    }
                                                }
                                            }
                                        }
                                    },
                                },
                                new AvCacheResultOffersOffer
                                {
                                    Accom = new[] {
                                        new AvCacheResultOffersOfferAccom {
                                            Code = "2",
                                            Prom = "xxCX",
                                            Unit = new []
                                            {
                                                new AvCacheResultOffersOfferAccomUnit
                                                {
                                                    Occ = new AvCacheResultOffersOfferAccomUnitOcc
                                                    {
                                                        Ad = 2,
                                                        Ch = 1
                                                    }
                                                }
                                            }
                                        }
                                    },
                                }
                            }
                        }
                    }
                }
            }
        });

        // Act
        var result = await _sut.DoSearch(namedSearch, new[] { "ES" }, dateRange, "LGW", "UK");

        // Assert
        result.Should().BeEquivalentTo(new List<AvCacheResultOffersOffer> {
            new AvCacheResultOffersOffer
            {
                GiataCode = "2222222",
                Accom = new[] {
                    new AvCacheResultOffersOfferAccom {
                        Code = "2",
                        Prom = "xxCX",
                        Unit = new []
                        {
                            new AvCacheResultOffersOfferAccomUnit
                            {
                                Occ = new AvCacheResultOffersOfferAccomUnitOcc
                                {
                                    Ad = 2,
                                    Ch = 1
                                }
                            }
                        }
                    }
                },
                AllBoards = new List<Board>()
            }
        });
    }

    [Fact]
    public void FilterByTheme_NoTheme_NoFilter()
    {
        // Arrange
        var offers = new List<AvCacheResultOffersOffer>() {
            new AvCacheResultOffersOffer
            {
                Accom = new[] {
                    new AvCacheResultOffersOfferAccom {
                        Code = "1",
                        Prom = "BFxx"
                    }
                },
            }
        };

        // Act
        var result = _sut.FilterByTheme(offers, null);

        // Assert
        result.Should().BeEquivalentTo(offers);
    }

    [Theory]
#pragma warning disable xUnit1045 // Avoid using TheoryData type arguments that might not be serializable
    [MemberData(nameof(FilterByThemeTestData))]
#pragma warning restore xUnit1045 // Avoid using TheoryData type arguments that might not be serializable
    public void FilterByTheme_Filter(string because, string[] theme, Collection<AvCacheResultOffersOffer> offers, Collection<AvCacheResultOffersOffer> expected)
    {
        // Arrange           

        // Act
        var result = _sut.FilterByTheme(offers.ToList(), theme);

        // Assert
        result.Should().BeEquivalentTo(expected, because);
    }

    public static TheoryData<string, string[], Collection<AvCacheResultOffersOffer>, Collection<AvCacheResultOffersOffer>>
        FilterByThemeTestData =>
        new()
        {
            {
                "Single theme code", new Collection<string> {"B"}.ToArray(),
                new Collection<AvCacheResultOffersOffer>
                {
                    new() {Accom = new[] {new AvCacheResultOffersOfferAccom {Code = "1", Prom = "xxBA"}}},
                    new() {Accom = new[] {new AvCacheResultOffersOfferAccom {Code = "2", Prom = "xxBB"}}},
                    new() {Accom = new[] {new AvCacheResultOffersOfferAccom {Code = "3", Prom = "xxCA"}}}
                },
                new Collection<AvCacheResultOffersOffer>
                {
                    new() {Accom = new[] {new AvCacheResultOffersOfferAccom {Code = "1", Prom = "xxBA"}}},
                    new() {Accom = new[] {new AvCacheResultOffersOfferAccom {Code = "2", Prom = "xxBB"}}}
                }
            },
            {
                "Multiple theme type codes in upper & lower cases", new Collection<string>  {"bB", " c ", "t"}.ToArray(),
                new Collection<AvCacheResultOffersOffer>
                {
                    new() {Accom = new[] {new AvCacheResultOffersOfferAccom {Code = "1", Prom = "xxBB"}}},
                    new() {Accom = new[] {new AvCacheResultOffersOfferAccom {Code = "2", Prom = "xxBAAAx"}}},
                    new() {Accom = new[] {new AvCacheResultOffersOfferAccom {Code = "3", Prom = "xxCzz"}}}
                },
                new Collection<AvCacheResultOffersOffer>
                {
                    new() {Accom = new[] {new AvCacheResultOffersOfferAccom {Code = "1", Prom = "xxBB"}}},
                    new() {Accom = new[] {new AvCacheResultOffersOfferAccom {Code = "3", Prom = "xxCzz"}}}
                }
            }
        };
}