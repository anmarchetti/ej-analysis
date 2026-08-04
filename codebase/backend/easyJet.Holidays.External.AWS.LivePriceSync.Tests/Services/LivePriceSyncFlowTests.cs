using easyJet.Holidays.Api.Domain.Data.LivePrice;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Interfaces.LivePrice;
using easyJet.Holidays.Api.Domain.Services.Market;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Atcom.Models.Internal.Search;
using easyJet.Holidays.External.Atcom.Services.TouristTax;
using easyJet.Holidays.External.AWS.LivePriceSync.Models;
using easyJet.Holidays.External.AWS.LivePriceSync.Services;
using easyJet.Holidays.External.AWS.LivePriceSync.Settings;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.AWS.LivePriceSync.Tests.Services;

public class LivePriceSyncFlowTests
{
    private readonly Mock<IMarketService> _marketService;
    private readonly Mock<ILivePriceSearchService> _searchServiceMock;
    private readonly Mock<ILivePriceAggregationService> _livePriceServiceMock;
    private readonly Mock<ILivePriceService> _livePriceDataServiceMock;


    private readonly Mock<IOffersPreparationService> _offersMapper;

    private readonly Mock<LanguageService> _languageService;
    private readonly Mock<ILivePriceSettingsService> _settingsService;

    private readonly Mock<ILogger<LivePriceSyncFlow>> _loggerMock;
    private readonly LambdaSettings _lambdaSettings;
    private readonly LanguageSettings _languageSettings;

    private readonly LivePriceSyncFlow _sut;

    public LivePriceSyncFlowTests()
    {
        _marketService = new();
        _searchServiceMock = new();
        _livePriceServiceMock = new();
        _livePriceDataServiceMock = new();

        _offersMapper = new();
        _languageService = new("en");
        _settingsService = new();

        _loggerMock = new();

        _lambdaSettings = new();
        _languageSettings = new();

        _sut = new(
           _marketService.Object,
           _settingsService.Object,
           _languageService.Object,
           _searchServiceMock.Object,
           _offersMapper.Object,
           _livePriceServiceMock.Object,
           _livePriceDataServiceMock.Object,
           _loggerMock.Object,
           Options.Create(_lambdaSettings),
           Options.Create(_languageSettings)
        );
    }

    [Fact]
    public async Task Sync_OnMissingMarket_Throws()
    {
        // Arrange
        var inputMarket = "US";
        _marketService.Setup(mock => mock.GetMarket(inputMarket)).Returns((MarketSettings)null!);

        // Act
        var action = async () => await _sut.Sync(inputMarket);

        // Assert
        await action.Should().ThrowAsync<InvalidOperationException>();

        _settingsService.VerifyNoOtherCalls();
        _searchServiceMock.VerifyNoOtherCalls();
        _offersMapper.VerifyNoOtherCalls();
    }


    [Fact]
    public async Task Sync_TwoNamedSearches_SearchAggregateAndSave()
    {
        // Arrange
        _marketService.Setup(mock => mock.GetMarket(It.IsAny<string>())).Returns(new MarketSettings()
        {
            AirportDepartureCodes = ["LGW"]
        });
        var searchRange = new DateRange
        {
            Start = new DateTimeOffset(2020, 7, 1, 0, 0, 0, TimeSpan.Zero),
            End = new DateTimeOffset(2020, 9, 1, 0, 0, 0, TimeSpan.Zero),
        };

        InjectConfig(new LivePriceConfiguration
        {
            DataExpiresDays = 10,
            NamedSearches = new List<NamedSearchConfig> {
                    new NamedSearchConfig {
                        NamedSearch = new NamedSearch {
                            Name = "city",
                            Adults = 2,
                            Duration = 7,
                            Language = "en"
                        },
                        Schedule = new List<DestinationSchedule> {
                            new DestinationSchedule {
                                CountryCodes = new List<string> { "ES"},
                                Schedule= new List<ScheduleItem> {
                                    new ScheduleItem {
                                        DateOfRun = new DateRange
                                        {
                                            Start = DateTimeOffset.UtcNow.AddDays(-10),
                                            End = DateTimeOffset.UtcNow.AddYears(1),
                                        },
                                        SearchDateRange = searchRange
                                    }
                                }
                            }
                        }
                    },
                    new NamedSearchConfig {
                        NamedSearch = new NamedSearch {
                            Name = "family",
                            Adults = 2,
                            Children = 1,
                            Duration = 10,
                            Language = "en"
                        },
                        Schedule = new List<DestinationSchedule> {
                            new DestinationSchedule {
                                CountryCodes = new List<string> { "ES"},
                                Schedule= new List<ScheduleItem> {
                                    new ScheduleItem {
                                        DateOfRun = new DateRange
                                        {
                                            Start = DateTimeOffset.UtcNow.AddDays(-10),
                                            End = DateTimeOffset.UtcNow.AddYears(1),
                                        },
                                        SearchDateRange = searchRange
                                    }
                                }
                            }
                        }
                    },
                    }
        });

        _livePriceServiceMock.Setup(
            x =>
            x.AggregateOffers(It.IsAny<MarketInfo>(),
                It.IsAny<Dictionary<NamedSearch, List<OffersBucket>>>(),
                It.IsAny<List<(NamedSearch, Exception)>>())
            ).Returns(new Dictionary<string, GeogPricesModel>());

        _livePriceDataServiceMock.Setup(x => x.Save(It.IsAny<LivePriceTableSetting>(), It.IsAny<Dictionary<string, GeogPricesModel>>(), It.IsAny<int>())).Returns(Task.CompletedTask);

        _settingsService.Setup(x => x.ExcludeOffersThatAreNotInCms(It.IsAny<List<AvCacheResultOffersOffer>>(), It.IsAny<string>())).ReturnsAsync(new List<AvCacheResultOffersOffer> {
                new AvCacheResultOffersOffer()
            });

        _settingsService.Setup(x => x.GetValidRange(It.IsAny<DateTimeOffset>(), It.IsAny<DateRange>()))
            .Returns(searchRange);

        _searchServiceMock.Setup(
            mock =>
                mock.DoSearch(It.IsAny<NamedSearch>(), It.IsAny<IEnumerable<string>>(), It.IsAny<DateRange>(), It.IsAny<string>(), It.IsAny<string>())
        ).ReturnsAsync([new AvCacheResultOffersOffer()]);

        // Act
        await _sut.Sync("en");

        // Assert
        // 2 search calls
        _searchServiceMock.Verify(m => m.DoSearch(
            It.Is<NamedSearch>(ns => ns.Adults == 2 && ns.Duration == 7),
            It.Is<IEnumerable<string>>(x => x.SequenceEqual(new List<string> { "ES" })),
            It.Is<DateRange>(range => range.Start == searchRange.Start && range.End == searchRange.End),
            It.IsAny<string>(),
            It.IsAny<string>()
        ), Times.Once);

        _searchServiceMock.Verify(m => m.DoSearch(
            It.Is<NamedSearch>(ns => ns.Adults == 2 && ns.Children == 1 && ns.Duration == 10),
            It.Is<IEnumerable<string>>(x => x.SequenceEqual(new List<string> { "ES" })),
            It.Is<DateRange>(range => range.Start == searchRange.Start && range.End == searchRange.End),
            It.IsAny<string>(),
            It.IsAny<string>()
        ), Times.Once);

        // 2 filterOffer calls
        _settingsService.Verify(m => m.ExcludeOffersThatAreNotInCms(It.IsAny<List<AvCacheResultOffersOffer>>(), It.IsAny<string>()), Times.Exactly(2));

        // 2 Aggregate with dictionary which contains named search keys
        _livePriceServiceMock.Verify(
            m =>
            m.AggregateOffers(It.IsAny<MarketInfo>(),
                It.Is<Dictionary<NamedSearch, List<OffersBucket>>>(x => x.Keys.Select(k => k.Name).SequenceEqual(new List<string> { "city", "family" })),
                It.IsAny<List<(NamedSearch, Exception)>>()
        ), Times.Once);

        // Save to dynamo
        _livePriceDataServiceMock.Verify(x => x.Save(
            It.IsAny<LivePriceTableSetting>(), It.IsAny<Dictionary<string, GeogPricesModel>>(), It.IsAny<int>()
        ), Times.Once);
    }

    [Fact]
    public async Task Sync_SchedulePeriodIsAfterNow_NoCalls()
    {
        // Arrange
        _marketService.Setup(mock => mock.GetMarket(It.IsAny<string>())).Returns(new MarketSettings()
        {
            AirportDepartureCodes = ["LGW"]
        });
        var searchRange = new DateRange
        {
            Start = new DateTimeOffset(2020, 7, 1, 0, 0, 0, TimeSpan.Zero),
            End = new DateTimeOffset(2020, 9, 1, 0, 0, 0, TimeSpan.Zero),
        };

        InjectConfig(new LivePriceConfiguration
        {
            NamedSearches = new List<NamedSearchConfig> {
                    new NamedSearchConfig {
                        NamedSearch = new(){ Language = "en" },
                        Schedule = new List<DestinationSchedule> {
                            new DestinationSchedule {
                                CountryCodes = new List<string> { "ES"},
                                Schedule= new List<ScheduleItem> {
                                    new ScheduleItem {
                                        DateOfRun = new DateRange
                                        {
                                            Start = DateTimeOffset.MinValue,
                                            End = DateTimeOffset.MinValue.AddYears(1000),
                                        },
                                        SearchDateRange = searchRange
                                    }
                                }
                            }
                        }
                    }
                }
        });

        // Act
        await _sut.Sync("en");

        // Assert
        _livePriceServiceMock.Verify(x => x.AggregateOffers(It.IsAny<MarketInfo>(), It.IsAny<Dictionary<NamedSearch, List<OffersBucket>>>(), It.IsAny<List<(NamedSearch, Exception)>>()), Times.Never);
        _livePriceDataServiceMock.Verify(x => x.Save(It.IsAny<LivePriceTableSetting>(), It.IsAny<Dictionary<string, GeogPricesModel>>(), It.IsAny<int>()), Times.Never);
    }

    [Theory]
    [MemberData(nameof(SyncNullOrEmptyConfigGenerator))]
    public async Task Sync_ScheduleIsNullOrEmptyForNamedSearch_NoCalls(LivePriceConfiguration config)
    {
        // Arrange
        _marketService.Setup(mock => mock.GetMarket(It.IsAny<string>())).Returns(new MarketSettings()
        {
            AirportDepartureCodes = ["LGW"]
        });
        InjectConfig(config);

        // Act
        await _sut.Sync("en");

        // Assert
        _livePriceServiceMock.Verify(x => x.AggregateOffers(It.IsAny<MarketInfo>(), It.IsAny<Dictionary<NamedSearch, List<OffersBucket>>>(), It.IsAny<List<(NamedSearch, Exception)>>()), Times.Never);
        _livePriceDataServiceMock.Verify(x => x.Save(It.IsAny<LivePriceTableSetting>(), It.IsAny<Dictionary<string, GeogPricesModel>>(), It.IsAny<int>()), Times.Never);
        _livePriceDataServiceMock.Verify(mock => mock.DeleteOlderThan(It.IsAny<LivePriceTableSetting>(), It.IsAny<long>(), It.IsAny<string>()), Times.Once);
    }

    public static TheoryData<LivePriceConfiguration> SyncNullOrEmptyConfigGenerator =
    [
        new LivePriceConfiguration()
        {
            NamedSearches = new List<NamedSearchConfig>()
            {
                new NamedSearchConfig()
                {
                    NamedSearch = new(){ Name = "1234", Language = "en" },
                    Schedule = null,
                }
            }
        },
        new LivePriceConfiguration()
        {
            NamedSearches = new List<NamedSearchConfig>()
            {
                new NamedSearchConfig()
                {
                    NamedSearch = new(){ Name = "4321", Language = "en"  },
                    Schedule = new(),
                }
            }
        }
    ];


    [Fact]
    public async Task SyncPrices_LocatesCorrectSchedule_CompletesSuccessfully()
    {
        // Arrange
        _settingsService.Setup(mock => mock.GetValidRange(It.IsAny<DateTimeOffset>(), It.IsAny<DateRange>()))
            .Returns(GetValidRange());

        var now = DateTime.UtcNow;
        var correctSearchRange = GetValidRange();
        var namedSearch = new NamedSearch() { Name = "testId", Language = "en" };
        var config = new LivePriceConfiguration()
        {
            NamedSearches = new List<NamedSearchConfig>()
                {
                    new NamedSearchConfig()
                    {
                        NamedSearch = namedSearch,
                        Schedule = new List<DestinationSchedule>()
                        {
                            new()
                            {
                                CountryCodes = new List<string>() { "te", "st"},
                                Schedule = new List<ScheduleItem>
                                {
                                    new ScheduleItem()
                                    {
                                        DateOfRun =  new(){ Start = now.AddDays(-1), End = now.AddDays(10) },
                                        SearchDateRange = correctSearchRange,
                                    },
                                    new ScheduleItem()
                                    {
                                        DateOfRun = new(){ Start = now.AddDays(-10), End = now.AddDays(-1) },
                                        SearchDateRange = GetValidRange(),
                                    }
                                }
                            }
                        }
                    }
                }
        };
        InjectConfig(config);

        var marketCode = "UK";
        var marketSettings = new MarketSettings()
        {
            Code = marketCode,
            AirportDepartureCodes = new HashSet<string> { "LGW" }
        };
        InjectMarketSettings(marketSettings);

        _searchServiceMock.Setup(
            mock =>
            mock.DoSearch(It.IsAny<NamedSearch>(), It.IsAny<IEnumerable<string>>(), It.IsAny<DateRange>(), It.IsAny<string>(), It.IsAny<string>())
        ).ReturnsAsync(new List<AvCacheResultOffersOffer>() { new AvCacheResultOffersOffer() });
        _livePriceServiceMock.Setup(
            mock =>
            mock.AggregateOffers(It.IsAny<MarketInfo>(),
                It.IsAny<Dictionary<NamedSearch, List<OffersBucket>>>(),
                It.IsAny<List<(NamedSearch, Exception)>>()
            )
        ).Returns(new Dictionary<string, GeogPricesModel>());
        _livePriceDataServiceMock.Setup(
            mock =>
            mock.DeleteOlderThan(It.IsAny<LivePriceTableSetting>(), It.IsAny<long>(), It.IsAny<string>()
            )
        ).Returns(Task.CompletedTask);
        _settingsService.Setup(
            mock => mock.ExcludeOffersThatAreNotInCms(It.IsAny<List<AvCacheResultOffersOffer>>(), It.IsAny<string>())
        ).ReturnsAsync(new List<AvCacheResultOffersOffer>() { new AvCacheResultOffersOffer() });
        _settingsService.Setup(x => x.GetValidRange(It.IsAny<DateTimeOffset>(), It.IsAny<DateRange>()))
        .Returns(correctSearchRange);

        // Act
        Func<Task> action = async () => await _sut.Sync(marketCode);

        // Assert
        var exc = await Record.ExceptionAsync(action);
        exc.Should().BeNull();

        _searchServiceMock.Verify(
            mock =>
            mock.DoSearch(
                It.Is<NamedSearch>(parSearch => parSearch.Equals(namedSearch)),
                It.IsAny<IEnumerable<string>>(),
                It.Is<DateRange>(dateRange => dateRange.Equals(correctSearchRange)),
                It.IsAny<string>(),
                It.IsAny<string>()
            ), Times.Once
        );
        _searchServiceMock.Verify(
            mock =>
            mock.DoSearch(
                It.Is<NamedSearch>(parSearch => parSearch.Equals(namedSearch)),
                It.IsAny<IEnumerable<string>>(),
                It.Is<DateRange>(dateRange => !dateRange.Equals(correctSearchRange)),
                It.IsAny<string>(),
                It.IsAny<string>()
            ), Times.Never
        );
        _livePriceServiceMock.Verify(
            mock =>
            mock.AggregateOffers(It.IsAny<MarketInfo>(),
                It.Is<Dictionary<NamedSearch, List<OffersBucket>>>(parDict => parDict.Keys.Contains(namedSearch)),
                It.IsAny<List<(NamedSearch, Exception)>>()
            ), Times.Once
        );
        _livePriceDataServiceMock.Verify(
            mock =>
            mock.DeleteOlderThan(
                It.IsAny<LivePriceTableSetting>(), It.IsAny<long>(), It.Is<string>(x => x.Equals("UK"))
            ), Times.Once
        );
    }

    [Fact]
    public async Task SyncPrices_NoScheduleWithSuitableEndDateInsteadUsesFallbackWithMatchingStart_CompletesSuccessfully()
    {
        // Arrange
        _marketService.Setup(mock => mock.GetMarket(It.IsAny<string>())).Returns(new MarketSettings()
        {
            AirportDepartureCodes = ["LGW"]
        });

        var now = DateTime.UtcNow;
        var correctSearchRange = new DateRange() { Start = DateTimeOffset.Parse("1111-11-11"), End = DateTimeOffset.Parse("2222-11-11") };
        var namedSearch = new NamedSearch() { Name = "testId", Language = "en" };
        var config = new LivePriceConfiguration()
        {
            NamedSearches = new List<NamedSearchConfig>()
                {
                    new NamedSearchConfig()
                    {
                        NamedSearch = namedSearch,
                        Schedule = new List<DestinationSchedule>()
                        {
                            new()
                            {
                                CountryCodes = new List<string>() { "te", "st"},
                                Schedule = new List<ScheduleItem>
                                {
                                    new ScheduleItem()
                                    {
                                        DateOfRun =  new(){ Start = now.AddDays(-10), End = now.AddDays(-1) },
                                        SearchDateRange = new DateRange(),
                                    },
                                },
                            },
                            new()
                            {
                                CountryCodes = new List<string>() { "TE", "ST"},
                                Schedule= new List<ScheduleItem>
                                {
                                    new ScheduleItem()
                                    {
                                        DateOfRun= new(){ Start = now.AddDays(-10), End = now.AddDays(-1) },
                                        SearchDateRange = new(),
                                    },
                                    new ScheduleItem()
                                    {
                                        DateOfRun = new(){ Start = now.AddDays(10), End = now.AddDays(100) },
                                        SearchDateRange = correctSearchRange,
                                    }
                                }
                            }
                        }
                    }
                }
        };

        InjectConfig(config);
        _searchServiceMock.Setup(
            mock =>
            mock.DoSearch(It.IsAny<NamedSearch>(), It.IsAny<IEnumerable<string>>(), It.IsAny<DateRange>(), It.IsAny<string>(), It.IsAny<string>())
        ).ReturnsAsync(new List<AvCacheResultOffersOffer>() { new AvCacheResultOffersOffer() });
        _livePriceServiceMock.Setup(
            mock =>
            mock.AggregateOffers(It.IsAny<MarketInfo>(),
                It.IsAny<Dictionary<NamedSearch, List<OffersBucket>>>(),
                It.IsAny<List<(NamedSearch, Exception)>>()
            )
        ).Returns(new Dictionary<string, GeogPricesModel>());
        _livePriceDataServiceMock.Setup(
            mock =>
            mock.DeleteOlderThan(It.IsAny<LivePriceTableSetting>(), It.IsAny<long>(), It.IsAny<string>()
            )
        ).Returns(Task.CompletedTask);
        _settingsService.Setup(
            mock => mock.ExcludeOffersThatAreNotInCms(It.IsAny<List<AvCacheResultOffersOffer>>(), It.IsAny<string>())
        ).ReturnsAsync(new List<AvCacheResultOffersOffer>() { new AvCacheResultOffersOffer() });
        _settingsService.Setup(x => x.GetValidRange(It.IsAny<DateTimeOffset>(), It.IsAny<DateRange>()))
        .Returns(correctSearchRange);

        // Act
        Func<Task> action = async () => await _sut.Sync("en");

        // Assert
        var exc = await Record.ExceptionAsync(action);
        exc.Should().BeNull();

        _searchServiceMock.Verify(
            mock =>
            mock.DoSearch(
                It.Is<NamedSearch>(parSearch => parSearch.Equals(namedSearch)),
                It.IsAny<IEnumerable<string>>(),
                It.Is<DateRange>(dateRange => dateRange.Equals(correctSearchRange)),
                It.IsAny<string>()
            , It.IsAny<string>()), Times.Once
        );
        _searchServiceMock.Verify(
            mock =>
            mock.DoSearch(
                It.Is<NamedSearch>(parSearch => parSearch.Equals(namedSearch)),
                It.IsAny<IEnumerable<string>>(),
                It.Is<DateRange>(dateRange => !dateRange.Equals(correctSearchRange)),
                It.IsAny<string>()
            , It.IsAny<string>()), Times.Never
        );
        _livePriceServiceMock.Verify(
            mock =>
            mock.AggregateOffers(It.IsAny<MarketInfo>(),
                It.Is<Dictionary<NamedSearch, List<OffersBucket>>>(parDict => parDict.Keys.Contains(namedSearch)),
                It.IsAny<List<(NamedSearch, Exception)>>()
            ), Times.Once
        );
        _livePriceDataServiceMock.Verify(
            mock =>
            mock.DeleteOlderThan(
                It.IsAny<LivePriceTableSetting>(), It.IsAny<long>(), It.IsAny<string>()
            ), Times.Once
        );
    }

    [Fact]
    public async Task SyncPrices_DetectsAndLogsOverlappingEntriesInSchedule_CompletesSuccessfully()
    {
        // Arrange
        _marketService.Setup(mock => mock.GetMarket(It.IsAny<string>())).Returns(new MarketSettings()
        {
            AirportDepartureCodes = ["LGW"]
        });
        var now = DateTime.UtcNow;
        var namedSearch = new NamedSearch() { Name = "testId", Language = "en" };
        var config = new LivePriceConfiguration()
        {
            NamedSearches = new List<NamedSearchConfig>()
                {
                    new NamedSearchConfig()
                    {
                        NamedSearch = namedSearch,
                        Schedule = new List<DestinationSchedule>()
                        {
                            new()
                            {
                                CountryCodes = new List<string>() { "te", "st"},
                                Schedule = new List<ScheduleItem>
                                {
                                    new ScheduleItem()
                                    {
                                        DateOfRun =  new(){ Start = now.AddDays(-10), End = now.AddDays(-1) },
                                        SearchDateRange = GetValidRange(),
                                    },
                                },
                            },
                            new()
                            {
                                CountryCodes = new List<string>() { "TE", "ST"},
                                Schedule= new List<ScheduleItem>
                                {
                                    new ScheduleItem()
                                    {
                                        DateOfRun= new(){ Start = now.AddDays(-1), End = now.AddDays(1) },
                                        SearchDateRange = GetValidRange(),
                                    },
                                    new ScheduleItem()
                                    {
                                        DateOfRun = new(){ Start = now.AddDays(-10), End = now.AddDays(100) },
                                        SearchDateRange = GetValidRange(),
                                    }
                                }
                            }
                        }
                    }
                }
        };

        InjectConfig(config);
        _searchServiceMock.Setup(
            mock =>
            mock.DoSearch(It.IsAny<NamedSearch>(), It.IsAny<IEnumerable<string>>(), It.IsAny<DateRange>(), It.IsAny<string>(), It.IsAny<string>())
        ).ReturnsAsync([new AvCacheResultOffersOffer()]);
        _livePriceServiceMock.Setup(
            mock =>
            mock.AggregateOffers(It.IsAny<MarketInfo>(),
                It.IsAny<Dictionary<NamedSearch, List<OffersBucket>>>(),
                It.IsAny<List<(NamedSearch, Exception)>>()
            )
        ).Returns(new Dictionary<string, GeogPricesModel>());
        _livePriceDataServiceMock.Setup(
            mock =>
            mock.DeleteOlderThan(It.IsAny<LivePriceTableSetting>(), It.IsAny<long>(), It.IsAny<string>()
            )
        ).Returns(Task.CompletedTask);
        _settingsService.Setup(mock => mock.GetValidRange(It.IsAny<DateTimeOffset>(), It.IsAny<DateRange>()))
            .Returns(GetValidRange());
        _settingsService.Setup(
            mock => mock.ExcludeOffersThatAreNotInCms(It.IsAny<List<AvCacheResultOffersOffer>>(), It.IsAny<string>())
        ).ReturnsAsync([new AvCacheResultOffersOffer()]);


        // Act
        await _sut.Sync("en");

        // Assert
        _searchServiceMock.Verify(
            mock =>
            mock.DoSearch(
                It.Is<NamedSearch>(parSearch => parSearch.Equals(namedSearch)),
                It.IsAny<IEnumerable<string>>(),
                It.IsAny<DateRange>(),
                It.IsAny<string>()
            , It.IsAny<string>()), Times.Once
        );
        _livePriceServiceMock.Verify(
            mock =>
            mock.AggregateOffers(It.IsAny<MarketInfo>(),
                It.Is<Dictionary<NamedSearch, List<OffersBucket>>>(parDict => parDict.Keys.Contains(namedSearch)),
                It.IsAny<List<(NamedSearch, Exception)>>()
            ), Times.Once
        );
        _livePriceDataServiceMock.Verify(
            mock =>
            mock.DeleteOlderThan(
                It.IsAny<LivePriceTableSetting>(), It.IsAny<long>(), It.IsAny<string>()
            ), Times.Once
        );
    }

    [Fact]
    public async Task SyncPrices_NoApplicableScheduleAvailable_SkipsFetchingAndAggregating()
    {
        // Arrange
        _marketService.Setup(mock => mock.GetMarket(It.IsAny<string>())).Returns(new MarketSettings()
        {
            AirportDepartureCodes = ["LGW"]
        });

        var now = DateTime.UtcNow;
        var namedSearch = new NamedSearch() { Name = "testId", Language = "en" };
        var config = new LivePriceConfiguration()
        {
            NamedSearches = new List<NamedSearchConfig>()
                {
                    new NamedSearchConfig()
                    {
                        NamedSearch = namedSearch,
                        Schedule = new List<DestinationSchedule>()
                        {
                            new()
                            {
                                CountryCodes = new List<string>() { "te", "st"},
                                Schedule = new List<ScheduleItem>
                                {
                                    new ScheduleItem()
                                    {
                                        DateOfRun =  new(){ Start = now.AddDays(-10), End = now.AddDays(-1) },
                                        SearchDateRange = new DateRange(),
                                    },
                                },
                            },
                            new()
                            {
                                CountryCodes = new List<string>() { "TE", "ST"},
                                Schedule= new List<ScheduleItem>
                                {
                                    new ScheduleItem()
                                    {
                                        DateOfRun= new(){ Start = now.AddDays(-10), End = now.AddDays(-1) },
                                        SearchDateRange = new(),
                                    },
                                    new ScheduleItem()
                                    {
                                        DateOfRun = new(){ Start = now.AddDays(-100), End = now.AddDays(-10) },
                                        SearchDateRange = new(),
                                    }
                                }
                            }
                        }
                    }
                }
        };

        InjectConfig(config);

        // Act
        var action = async () => await _sut.Sync("en");

        // Assert
        await action.Should().NotThrowAsync();

        _searchServiceMock.Verify(
            mock =>
            mock.DoSearch(
                It.Is<NamedSearch>(parSearch => parSearch.Equals(namedSearch)),
                It.IsAny<IEnumerable<string>>(),
                It.IsAny<DateRange>(),
                It.IsAny<string>()
            , It.IsAny<string>()), Times.Never
        );
        _livePriceServiceMock.Verify(
            mock =>
            mock.AggregateOffers(It.IsAny<MarketInfo>(),
                It.Is<Dictionary<NamedSearch, List<OffersBucket>>>(parDict => parDict.Keys.Contains(namedSearch)),
                It.IsAny<List<(NamedSearch, Exception)>>()
            ), Times.Never
        );
        _livePriceDataServiceMock.Verify(
            mock =>
            mock.DeleteOlderThan(
                It.IsAny<LivePriceTableSetting>(), It.IsAny<long>(), It.IsAny<string>()
            ), Times.Once
        );
    }

    [Theory]
    [MemberData(nameof(SyncApplicableScheduleWithInvalidRangeGenerator))]
    public async Task SyncPrices_NoDateRangeInApplicableSchedule_SkipsFetchingAndAggregating(LivePriceConfiguration config)
    {
        // Arrange
        _marketService.Setup(mock => mock.GetMarket(It.IsAny<string>())).Returns(new MarketSettings()
        {
            AirportDepartureCodes = ["LGW"]
        });

        var namedSearch = new NamedSearch() { Name = "testId", Language = "en" };
        InjectConfig(config);

        // Act
        var action = async () => await _sut.Sync("en");

        // Assert
        await action.Should().NotThrowAsync();

        _searchServiceMock.Verify(
            mock =>
            mock.DoSearch(
                It.Is<NamedSearch>(parSearch => parSearch.Equals(namedSearch)),
                It.IsAny<IEnumerable<string>>(),
                It.IsAny<DateRange>(),
                It.IsAny<string>()
                , It.IsAny<string>()), Times.Never
        );
        _livePriceServiceMock.Verify(
            mock =>
            mock.AggregateOffers(It.IsAny<MarketInfo>(),
                It.Is<Dictionary<NamedSearch, List<OffersBucket>>>(parDict => parDict.Keys.Contains(namedSearch)),
                It.IsAny<List<(NamedSearch, Exception)>>()
            ), Times.Never
        );
        _livePriceDataServiceMock.Verify(
            mock =>
            mock.DeleteOlderThan(
                It.IsAny<LivePriceTableSetting>(), It.IsAny<long>(), It.IsAny<string>()
            ), Times.Once
        );
    }

    /// <summary>
    /// old tests were commented with reason: System.ArgumentOutOfRangeException: The UTC time represented when the offset is applied must be between year 0 and 10,000. (Parameter 'offset')
    /// </summary>
    public static TheoryData<LivePriceConfiguration> SyncApplicableScheduleWithInvalidRangeGenerator =
    [
        BuildConfigForDateRange(DateTimeOffset.UtcNow, null),
        BuildConfigForDateRange(DateTimeOffset.UtcNow, new DateRange(){Start = null, End = DateTimeOffset.UtcNow.AddDays(1)}),
        //BuildConfigForDateRange(DateTimeOffset.UtcNow, new DateRange(){Start = default(DateTime), End = DateTimeOffset.UtcNow.AddDays(1)}),
        BuildConfigForDateRange(DateTimeOffset.UtcNow, new DateRange(){End = null, Start = DateTimeOffset.UtcNow.AddDays(-1)})
        //BuildConfigForDateRange(DateTimeOffset.UtcNow, new DateRange(){End = default(DateTime), Start = DateTimeOffset.UtcNow.AddDays(-1)})
    ];
    private static LivePriceConfiguration BuildConfigForDateRange(DateTimeOffset now, DateRange searchRangeToUse)
    {
        var namedSearch = new NamedSearch() { Name = "1234", Language = "en" };
        return new LivePriceConfiguration()
        {
            NamedSearches = new List<NamedSearchConfig>()
            {
                new NamedSearchConfig()
                {
                    NamedSearch = namedSearch,
                    Schedule = new List<DestinationSchedule>()
                    {
                        new()
                        {
                            CountryCodes = new List<string>() { "te", "st"},
                            Schedule = new List<ScheduleItem>
                            {
                                new ScheduleItem()
                                {
                                    DateOfRun =  new(){ Start = now.AddDays(-10), End = now.AddDays(10) },
                                    SearchDateRange = searchRangeToUse,
                                },
                            },
                        },
                    }
                }
            }
        };
    }


    [Fact]
    public async Task SyncPrices_HandlesFetchExceptions_ThrowsException()
    {
        _marketService.Setup(mock => mock.GetMarket(It.IsAny<string>())).Returns(new MarketSettings()
        {
            AirportDepartureCodes = ["LGW"]
        });

        _settingsService.Setup(mock => mock.GetValidRange(It.IsAny<DateTimeOffset>(), It.IsAny<DateRange>()))
            .Returns(GetValidRange());

        var now = DateTime.UtcNow;
        var config = new LivePriceConfiguration()
        {
            NamedSearches = new List<NamedSearchConfig>()
                {
                    new NamedSearchConfig()
                    {
                        NamedSearch = new(){ Name = "testId" , Language = "en"},
                        Schedule = new List<DestinationSchedule>()
                        {
                            new()
                            {
                                CountryCodes = new List<string>() { "te", "st"},
                                Schedule = new List<ScheduleItem>
                                {
                                    new ScheduleItem()
                                    {
                                        DateOfRun =  new(){ Start = now.AddDays(-1), End = now.AddDays(10) },
                                        SearchDateRange = new() { Start = DateTime.UtcNow, End = DateTime.UtcNow },
                                    },
                                }
                            }
                        }
                    }
                }
        };

        InjectConfig(config);
        _searchServiceMock.Setup(
            mock =>
            mock.DoSearch(It.IsAny<NamedSearch>(), It.IsAny<IEnumerable<string>>(), It.IsAny<DateRange>(), It.IsAny<string>(), It.IsAny<string>())
        ).ThrowsAsync(new InvalidOperationException());

        // Act
        var action = async () => await _sut.Sync("en");

        // Assert
        await action.Should().ThrowAsync<InvalidOperationException>();

        _searchServiceMock.Verify(
            mock =>
            mock.DoSearch(
                It.IsAny<NamedSearch>(),
                It.IsAny<IEnumerable<string>>(),
                It.IsAny<DateRange>(),
                It.IsAny<string>()
            , It.IsAny<string>()), Times.Once
        );
        _livePriceServiceMock.Verify(
            mock =>
            mock.AggregateOffers(It.IsAny<MarketInfo>(),
                It.IsAny<Dictionary<NamedSearch, List<OffersBucket>>>(),
                It.IsAny<List<(NamedSearch, Exception)>>()
            ), Times.Never
        );
        _livePriceDataServiceMock.Verify(
            mock =>
            mock.DeleteOlderThan(
                It.IsAny<LivePriceTableSetting>(), It.IsAny<long>(), It.IsAny<string>()
            ), Times.Once
        );
    }

    [Fact]
    public async Task SyncPrices_HandlesAggregationExceptions_ThrowsException()
    {
        _marketService.Setup(mock => mock.GetMarket(It.IsAny<string>())).Returns(new MarketSettings()
        {
            AirportDepartureCodes = ["LGW"]
        });
        var now = DateTime.UtcNow;
        var config = new LivePriceConfiguration()
        {
            NamedSearches = new List<NamedSearchConfig>()
                {
                    new NamedSearchConfig()
                    {
                        NamedSearch = new(){ Name = "testId" , Language = "en"},
                        Schedule = new List<DestinationSchedule>()
                        {
                            new()
                            {
                                CountryCodes = new List<string>() { "te", "st"},
                                Schedule = new List<ScheduleItem>
                                {
                                    new ScheduleItem()
                                    {
                                        DateOfRun =  new(){ Start = now.AddDays(-1), End = now.AddDays(10) },
                                        SearchDateRange = new() { Start = DateTime.UtcNow, End = DateTime.UtcNow },
                                    },
                                }
                            }
                        }
                    }
                }
        };
        InjectConfig(config);
        _searchServiceMock.Setup(
            mock =>
            mock.DoSearch(It.IsAny<NamedSearch>(), It.IsAny<IEnumerable<string>>(), It.IsAny<DateRange>(), It.IsAny<string>(), It.IsAny<string>())
        ).ReturnsAsync(new List<AvCacheResultOffersOffer>() { new AvCacheResultOffersOffer() });

        _settingsService.Setup(mock => mock.GetValidRange(It.IsAny<DateTimeOffset>(), It.IsAny<DateRange>()))
            .Returns(GetValidRange());
        _settingsService.Setup(
            mock => mock.ExcludeOffersThatAreNotInCms(It.IsAny<List<AvCacheResultOffersOffer>>(), It.IsAny<string>())
        ).ReturnsAsync(new List<AvCacheResultOffersOffer>() { new AvCacheResultOffersOffer() });


        _livePriceServiceMock.Setup(mock =>
            mock.AggregateOffers(
                It.IsAny<MarketInfo>(),
                It.IsAny<Dictionary<NamedSearch, List<OffersBucket>>>(),
                It.IsAny<List<(NamedSearch, Exception)>>())
        ).Callback<MarketInfo, Dictionary<NamedSearch, List<OffersBucket>>, IList<(NamedSearch Search, Exception Exc)>>(
            (_, _, aggregationExceptions) => aggregationExceptions.Add((config.NamedSearches[0].NamedSearch, new InvalidOperationException()))
        );

        _livePriceDataServiceMock.Setup(
            mock =>
            mock.Save(
                It.IsAny<LivePriceTableSetting>(),
                It.IsAny<Dictionary<string, GeogPricesModel>>(),
                It.IsAny<int>())
        ).Returns(Task.CompletedTask);

        // Act
        var action = async () => await _sut.Sync("en");


        // Assert
        await action.Should().ThrowAsync<InvalidOperationException>();

        _searchServiceMock.Verify(
            mock =>
            mock.DoSearch(
                It.IsAny<NamedSearch>(),
                It.IsAny<IEnumerable<string>>(),
                It.IsAny<DateRange>(),
                It.IsAny<string>()
            , It.IsAny<string>()), Times.Once
        );
        _livePriceServiceMock.Verify(
            mock =>
            mock.AggregateOffers(It.IsAny<MarketInfo>(),
                It.IsAny<Dictionary<NamedSearch, List<OffersBucket>>>(),
                It.IsAny<List<(NamedSearch, Exception)>>()
            ), Times.Once
        );
        _livePriceDataServiceMock.Verify(
            mock =>
            mock.Save(
                It.IsAny<LivePriceTableSetting>(),
                It.IsAny<Dictionary<string, GeogPricesModel>>(),
                It.IsAny<int>()
            ), Times.Once
        );
        _livePriceDataServiceMock.Verify(
            mock =>
            mock.DeleteOlderThan(
                It.IsAny<LivePriceTableSetting>(), It.IsAny<long>(), It.IsAny<string>()
            ), Times.Once
        );
    }

    private static DateRange GetValidRange()
    {
        var now = DateTime.Now;

        return new DateRange()
        {
            Start = now.AddDays(-1),
            End = now.AddDays(1),
        };
    }

    private void InjectConfig(LivePriceConfiguration config)
    {
        _settingsService.Setup(mock => mock.GetSettings(It.IsAny<MarketSettings>(), It.IsAny<LanguageSettings>()))
            .ReturnsAsync(config);
    }

    private void InjectMarketSettings(MarketSettings marketSettings)
    {
        _marketService.Setup(mock => mock.GetMarket(marketSettings.Code)).Returns(marketSettings);
    }
}