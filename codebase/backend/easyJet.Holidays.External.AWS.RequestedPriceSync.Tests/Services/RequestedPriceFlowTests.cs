using easyJet.Holidays.Api.Domain.Data.Common;
using easyJet.Holidays.Api.Domain.Data.Destinations;
using easyJet.Holidays.Api.Domain.Data.RequestedPrice;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Interfaces.Destinations;
using easyJet.Holidays.Api.Domain.Interfaces.RequestedPrice;
using easyJet.Holidays.External.Atcom.Models.Extensions;
using easyJet.Holidays.External.Atcom.Services.TouristTax;
using easyJet.Holidays.External.AWS.Models.RequestedPrice;
using easyJet.Holidays.External.AWS.RequestedPriceSync.Models;
using easyJet.Holidays.External.AWS.RequestedPriceSync.Services;
using easyJet.Holidays.External.AWS.RequestedPriceSync.Settings;
using easyJet.Holidays.External.AWS.Services.RequestedPrice.Models;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using System.Collections.Concurrent;
using System.Collections.ObjectModel;
using Xunit;

namespace easyJet.Holidays.External.AWS.RequestedPriceSync.Tests.Services;

public class RequestedPriceFlowTests
{
    private readonly Mock<IRequestedPriceCmsConnector> _cmsConnector;
    private readonly Mock<IAggregationService> _aggregationService;
    private readonly Mock<IDestinationsService> _destinationService;
    private readonly Mock<IRequestedPriceService> _requestedPriceService;
    private readonly Mock<ISearchService> _searchService;


    private readonly RequestedPriceFlow _sut;

    public RequestedPriceFlowTests()
    {
        _cmsConnector = new();
        _aggregationService = new();
        _destinationService = new();
        _requestedPriceService = new();
        _searchService = new();
        Mock<ILogger<RequestedPriceFlow>> logger = new();

        var lambdaSettings = new LambdaSettings()
        {
            ParallelizationLimit = 10
        };

        _sut = new RequestedPriceFlow(
            _cmsConnector.Object,
            _aggregationService.Object,
            _destinationService.Object,
            _requestedPriceService.Object,
            _searchService.Object,
            logger.Object,
            Options.Create(lambdaSettings)
        );
    }

    private void InjectConfig(RequestedPriceConfiguration config) => _cmsConnector.Setup(mock => mock.GetConfig(It.IsAny<string>())).ReturnsAsync(config);

    [Fact]
    public async Task Sync_TwoNamedSearches_SearchAggregateAndSave()
    {
        // Arrange
        var now = DateTime.UtcNow.Date;
        var searchRange = new DateRange
        {
            Start = now.AddDays(-10),
            End = now.AddDays(20),
        };

        InjectConfig(new RequestedPriceConfiguration
        {
            MarketCode = "UK",
            MarketLang = "en",
            NamedSearches = [
                new RequestedPriceNamedSearchConfig {
                    NamedSearch = new RequestedPriceNamedSearch {
                        Id= "city",
                        Adults = 2,
                        Duration = 7,
                        InitialSearchDays = 10,
                        StartDate = now.AddMonths(-1),
                        EndDate = now.AddMonths(2)
                    },
                    Schedule = [
                        new DestinationSchedule {
                            Destinations = ["ES"],
                            Schedule= [
                                new ScheduleItem {
                                    DateOfRun = new DateRange
                                    {
                                        Start = DateTimeUtc.New(2020, 1, 1),
                                        End = DateTimeUtc.New(2020, 12, 31)
                                    },
                                    SearchDateRange = searchRange
                                }
                            ]
                        }
                    ]
                },
                new RequestedPriceNamedSearchConfig {
                    NamedSearch = new RequestedPriceNamedSearch {
                        Id = "family",
                        Adults = 2,
                        Children = 1,
                        Duration = 10,
                        InitialSearchDays = 10,
                        StartDate = now.AddMonths(-1),
                        EndDate = now.AddMonths(2)
                    },
                    Schedule = [
                        new DestinationSchedule {
                            Destinations = ["ES"],
                            Schedule= [
                                new ScheduleItem {
                                    DateOfRun = new DateRange
                                    {
                                        Start = DateTimeUtc.New(2020, 1, 1),
                                        End = DateTimeUtc.New(2020, 12, 31)
                                    },
                                    SearchDateRange = searchRange
                                }
                            ]
                        }
                    ]
                },
            ]
        });

        _searchService.Setup(x => x.Search(It.IsAny<RequestedPriceNamedSearch>(),
                It.IsAny<List<DestinationItem>>()))
            .ReturnsAsync([
                new()
            ]);

        _destinationService.Setup(service => service.GetDestinationsByCodes(It.IsAny<ICollection<string>>(), It.IsAny<bool>()))
            .ReturnsAsync([new(){
                Code = "ES", Type = DestinationItemType.Country}]);

        _aggregationService.Setup(x =>
            x.AggregateOffers(
                It.IsAny<IDictionary<RequestedPriceNamedSearch, List<OffersBucket>>>(),
                It.IsAny<ConcurrentQueue<(RequestedPriceNamedSearch, Exception)>>(),
                It.IsAny<bool>(),
                It.IsAny<int>()
            )
        ).Returns([]);

        _requestedPriceService.Setup(x => x.Save(It.IsAny<Dictionary<string, PricesModel>>())).Returns(Task.CompletedTask);

        var input = new RequestedPriceSyncInput
        {
            Market = "UK",
            Language = "en",
            Take = 10
        };

        // Act
        await _sut.Process(input);

        // Assert
        // 1 search call with Duration == 7 - once
        _searchService.Verify(m => m.Search(
                It.Is<RequestedPriceNamedSearch>(ns => ns.Adults == 2 && ns.Duration == 7),
                It.IsAny<List<DestinationItem>>()),
            Times.Once);

        // 2 search calls in summary - twice 
        _searchService.Verify(m => m.Search(
                It.IsAny<RequestedPriceNamedSearch>(),
                It.IsAny<List<DestinationItem>>()),
            Times.Exactly(2));

        // 3 Aggregate with dictionary which contains named search keys
        _aggregationService.Verify(m => m.AggregateOffers(
            It.Is<IDictionary<RequestedPriceNamedSearch, List<OffersBucket>>>(x => x.Keys.Select(k => k.Id).OrderBy(k => k).SequenceEqual(new List<string> { "city", "family" })),
            It.IsAny<ConcurrentQueue<(RequestedPriceNamedSearch, Exception)>>(),
            It.IsAny<bool>(),
            It.IsAny<int>()
        ), Times.Once);

        // Save to dynamo
        _requestedPriceService.Verify(x => x.Save(
            It.IsAny<IDictionary<string, PricesModel>>()
        ), Times.Once);
    }

    [Fact]
    public async Task Sync_NoScheduleForNamedSearch_NoCalls()
    {
        // Arrange
        InjectConfig(new RequestedPriceConfiguration
        {
            NamedSearches = [new RequestedPriceNamedSearchConfig { NamedSearch = new RequestedPriceNamedSearch() }]
        });

        // Act
        var action = async () => await _sut.Process(new()
        {
            Language = "en",
            Market = "UK"
        });

        // Assert
        await action.Should().NotThrowAsync();
        _searchService.Verify(x => x.Search(It.IsAny<RequestedPriceNamedSearch>(), It.IsAny<List<DestinationItem>>()), Times.Never);
        _aggregationService.Verify(x => x.AggregateOffers(It.IsAny<Dictionary<RequestedPriceNamedSearch, List<OffersBucket>>>(), It.IsAny<ConcurrentQueue<(RequestedPriceNamedSearch, Exception)>>(), It.IsAny<bool>(), 1), Times.Never);
        _requestedPriceService.Verify(x => x.Save(It.IsAny<Dictionary<string, PricesModel>>()), Times.Never);
    }

    [Fact]
    public async Task Sync_SchedulePeriodIsAfterNow_NoCalls()
    {
        // Arrange
        var searchRange = new DateRange
        {
            Start = new DateTime(2020, 7, 1, 0, 0, 0),
            End = new DateTime(2020, 9, 1, 0, 0, 0),
        };

        InjectConfig(new RequestedPriceConfiguration
        {
            NamedSearches = [
                new RequestedPriceNamedSearchConfig {
                    NamedSearch = new RequestedPriceNamedSearch (){Id = "testSearch1"},
                    Schedule = [
                        new DestinationSchedule {
                            Destinations = ["ES"],
                            Schedule= [
                                new ScheduleItem {
                                   DateOfRun = new DateRange
                                    {
                                        Start = DateTime.MaxValue,
                                        End = DateTime.MaxValue
                                    },
                                    SearchDateRange = searchRange
                                }
                            ]
                        }
                    ]
                }
            ]
        });

        var input = new RequestedPriceSyncInput
        {
            Market = "UK",
            Language = "en"
        };

        // Act
        await _sut.Process(input);

        // Assert
        _searchService.Verify(x => x.Search(It.IsAny<RequestedPriceNamedSearch>(), It.IsAny<List<DestinationItem>>()), Times.Never);
        _aggregationService.Verify(x => x.AggregateOffers(It.IsAny<Dictionary<RequestedPriceNamedSearch, List<OffersBucket>>>(), It.IsAny<ConcurrentQueue<(RequestedPriceNamedSearch, Exception)>>(), It.IsAny<bool>(), 1), Times.Never);
        _requestedPriceService.Verify(x => x.Save(It.IsAny<Dictionary<string, PricesModel>>()), Times.Never);
    }

    [Fact(Skip = "move to connector")]
    public async Task Sync_EmptyOrigin_MappedToAllDeparturesFromMarket()
    {
        // Arrange
        var now = DateTime.UtcNow.Date;
        var searchRange = new DateRange
        {
            Start = now.AddDays(-10),
            End = now.AddDays(20),
        };

        InjectConfig(new RequestedPriceConfiguration
        {
            MarketCode = "UK",
            MarketLang = "en",
            NamedSearches = [
                new RequestedPriceNamedSearchConfig {
                    NamedSearch = new RequestedPriceNamedSearch {
                        Id= "city",
                        Adults = 2,
                        Duration = 7,
                        InitialSearchDays = 10,
                        StartDate = now.AddMonths(-1),
                        EndDate = now.AddMonths(2),
                        Origin = []
                    },
                    Schedule = [
                        new DestinationSchedule {
                            Destinations = ["ES"],
                            Schedule= [
                                new ScheduleItem {
                                   DateOfRun = new DateRange
                                    {
                                        Start = DateTimeUtc.New(2020, 1, 1),
                                        End = DateTimeUtc.New(2020, 12, 31),
                                    },
                                    SearchDateRange = searchRange
                                }
                            ]
                        }
                    ]
                }
            ]
        });

        _searchService
            .Setup(x => x.Search(It.IsAny<RequestedPriceNamedSearch>(), It.IsAny<List<DestinationItem>>()))
            .ReturnsAsync([new()]);

        _destinationService
            .Setup(service => service.GetDestinationsByCodes(It.IsAny<ICollection<string>>(), It.IsAny<bool>()))
            .ReturnsAsync([new() { Code = "ES", Type = DestinationItemType.Country }]);

        _aggregationService
            .Setup(x => x.AggregateOffers(
                It.IsAny<IDictionary<RequestedPriceNamedSearch, List<OffersBucket>>>(),
                It.IsAny<ConcurrentQueue<(RequestedPriceNamedSearch, Exception)>>(),
                It.IsAny<bool>(),
                It.IsAny<int>()))
            .Returns([]);

        _requestedPriceService
            .Setup(x => x.Save(It.IsAny<Dictionary<string, PricesModel>>()))
            .Returns(Task.CompletedTask);

        var input = new RequestedPriceSyncInput
        {
            Market = "UK",
            Language = "en",
            Take = 10
        };

        // Act
        await _sut.Process(input);

        // Assert
        _searchService.Verify(m => m.Search(
            It.Is<RequestedPriceNamedSearch>(search =>
                search.Origin.ElementAt(0) == "LTN" && search.Origin.ElementAt(1) == "LYN"),
            It.IsAny<List<DestinationItem>>()));
    }

    [Fact]
    public async Task SyncPrices_HandlesFetchingExceptions_ThrowsException()
    {
        // Arrange
        var input = new RequestedPriceSyncInput
        {
            Market = "UK",
            Language = "en",
            Timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
            Take = 1,
            Skip = 0,
            IsLast = false
        };

        var now = DateTime.UtcNow.Date;
        var config = new RequestedPriceConfiguration
        {
            MarketCode = "UK",
            MarketLang = "en",
            NamedSearches =
            [
                new RequestedPriceNamedSearchConfig
                {
                    NamedSearch = new RequestedPriceNamedSearch
                    {
                        Id = "city",
                        Adults = 2,
                        Duration = 7,
                        InitialSearchDays = 10,
                        StartDate = now.AddMonths(-1),
                        EndDate = now.AddMonths(2),
                        Origin = []
                    },
                    Schedule = null
                }
            ]
        };
        InjectConfig(config);

        // Act
        var action = async () => await _sut.Process(input);

        // Assert
        await action.Should().ThrowAsync<Exception>();
    }

    [Fact]
    public async Task SyncPrices_HandlesAggregationExceptions_ThrowsException()
    {
        // Arrange
        var input = new RequestedPriceSyncInput
        {
            Market = "UK",
            Language = "en",
            Timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
            Take = 1,
            Skip = 0,
            IsLast = false
        };

        var now = DateTime.UtcNow.Date;
        var searchRange = new DateRange
        {
            Start = now.AddDays(-10),
            End = now.AddDays(20),
        };
        var config = new RequestedPriceConfiguration
        {
            MarketCode = "UK",
            MarketLang = "en",
            NamedSearches = [
                new RequestedPriceNamedSearchConfig {
                    NamedSearch = new RequestedPriceNamedSearch {
                        Id= "city",
                        Adults = 2,
                        Duration = 7,
                        InitialSearchDays = 10,
                        StartDate = now.AddMonths(-1),
                        EndDate = now.AddMonths(2),
                        Origin = []
                    },
                    Schedule = [
                        new DestinationSchedule {
                            Destinations = ["ES"],
                            Schedule= [
                                new ScheduleItem {
                                   DateOfRun = new DateRange
                                    {
                                        Start = DateTimeUtc.New(2020, 1, 1),
                                        End = DateTimeUtc.New(2020, 12, 31),
                                    },
                                    SearchDateRange = searchRange
                                }
                            ]
                        }
                    ]
                }
            ]
        };
        InjectConfig(config);

        _searchService
            .Setup(x => x.Search(It.IsAny<RequestedPriceNamedSearch>(), It.IsAny<List<DestinationItem>>()))
            .ReturnsAsync([new()]);

        _destinationService
            .Setup(service => service.GetDestinationsByCodes(It.IsAny<ICollection<string>>(), It.IsAny<bool>()))
            .ReturnsAsync([new() { Code = "ES", Type = DestinationItemType.Country }]);

        _aggregationService
            .Setup(x => x.AggregateOffers(
                It.IsAny<IDictionary<RequestedPriceNamedSearch, List<OffersBucket>>>(),
                It.IsAny<ConcurrentQueue<(RequestedPriceNamedSearch config, Exception exception)>>(),
                It.IsAny<bool>(),
                It.IsAny<int>()
            )).Throws(new InvalidOperationException());

        // Act
        var action = async () => await _sut.Process(input);

        // Assert
        await action.Should().ThrowAsync<Exception>();

        _destinationService.Verify(
            service => service.GetDestinationsByCodes(
                It.IsAny<ICollection<string>>(),
                It.IsAny<bool>()),
            Times.AtLeastOnce
        );
        _searchService.Verify(
            mock => mock.Search(
                It.IsAny<RequestedPriceNamedSearch>(),
                It.IsAny<List<DestinationItem>>()
            ),
            Times.Once
        );
    }

    [Fact]
    public void UpdateDatesForNamedSearch_NoStartAndEndDate_AppliesSearchRangeDates()
    {
        // Arrange
        var now = DateTime.UtcNow.Date;
        var namedSearch = new RequestedPriceNamedSearch
        {
            InitialSearchDays = 10,
            StartDate = DateTime.MinValue,
            EndDate = DateTime.MinValue,
        };

        var searchRange = new DateRange
        {
            Start = now,
            End = now.AddMonths(2),
        };

        // Act
        RequestedPriceFlow.UpdateDatesForNamedSearch(namedSearch, searchRange);

        // Assert
        namedSearch.StartDate.Should().Be(searchRange.Start.Value);
        namedSearch.EndDate.Should().Be(searchRange.End.Value);
    }

    [Fact]
    public void UpdateDatesForNamedSearch_SearchRangeStartDateInPast_AppliesNow()
    {
        // Arrange
        var now = DateTime.UtcNow.Date;
        var namedSearchStartDate = now.AddMonths(-1);
        var namedSearchEndDate = now.AddMonths(2);
        var namedSearch = new RequestedPriceNamedSearch
        {
            InitialSearchDays = 10,
            StartDate = namedSearchStartDate,
            EndDate = namedSearchEndDate,
        };

        var searchRange = new DateRange
        {
            Start = now.AddMonths(-1)
        };

        // Act
        RequestedPriceFlow.UpdateDatesForNamedSearch(namedSearch, searchRange);

        // Assert
        namedSearch.StartDate.Should().Be(now);
        namedSearch.EndDate.Should().Be(namedSearchEndDate);
    }

    [Fact]
    public void UpdateDatesForNamedSearch_SearchRangeStartDateInFuture_SearchRangeStartDate()
    {
        // Arrange
        var now = DateTime.UtcNow.Date;
        var namedSearchStartDate = now.AddMonths(-1);
        var namedSearchEndDate = now.AddMonths(2);
        var namedSearch = new RequestedPriceNamedSearch
        {
            InitialSearchDays = 10,
            StartDate = namedSearchStartDate,
            EndDate = namedSearchEndDate,
        };

        var searchRange = new DateRange
        {
            Start = now.AddMonths(1)
        };

        // Act
        RequestedPriceFlow.UpdateDatesForNamedSearch(namedSearch, searchRange);

        // Assert
        namedSearch.StartDate.Should().Be(searchRange.Start.Value);
        namedSearch.EndDate.Should().Be(namedSearchEndDate);
    }

    [Fact]
    public void UpdateDatesForNamedSearch_InitialSearchDaysEmpty_IgnoresSearchRange()
    {
        // Arrange
        var now = DateTime.UtcNow.Date;
        var namedSearchStartDate = now.AddMonths(-1);
        var namedSearchEndDate = now.AddMonths(2);
        var namedSearch = new RequestedPriceNamedSearch
        {
            InitialSearchDays = 0,
            StartDate = namedSearchStartDate,
            EndDate = namedSearchEndDate,
        };

        var searchRange = new DateRange
        {
            Start = now.AddMonths(1),
            End = now.AddMonths(3)
        };

        // Act
        RequestedPriceFlow.UpdateDatesForNamedSearch(namedSearch, searchRange);

        // Assert
        namedSearch.StartDate.Should().Be(searchRange.Start.Value);
        namedSearch.EndDate.Should().Be(namedSearchEndDate);
    }

    [Fact]
    public void UpdateDatesForNamedSearch_SearchRangeEndDateBeforeStartPlusInitialDays_AppliesSearchRangeEndDate()
    {
        // Arrange
        var now = DateTime.UtcNow.Date;
        var namedSearchStartDate = now.AddMonths(-1);
        var namedSearchEndDate = now.AddMonths(2);
        var namedSearch = new RequestedPriceNamedSearch
        {
            InitialSearchDays = 10,
            StartDate = namedSearchStartDate,
            EndDate = namedSearchEndDate,
        };

        var searchRange = new DateRange
        {
            Start = now.AddMonths(-3),
            End = now.AddMonths(-1)
        };

        // Act
        RequestedPriceFlow.UpdateDatesForNamedSearch(namedSearch, searchRange);

        // Assert
        namedSearch.StartDate.Should().Be(now);
        namedSearch.EndDate.Should().Be(searchRange.End.Value);
    }

    [Fact]
    public void ValidateDateData_NoInitialSearchDays_NoEndDate()
    {
        // Arrange
        var now = DateTime.UtcNow.Date;
        var namedSearch = new RequestedPriceNamedSearch
        {
            InitialSearchDays = 0,
            EndDate = DateTime.MinValue,
        };

        var searchRange = new DateRange
        {
            End = now.AddMonths(-1)
        };

        // Act
        var result = RequestedPriceFlow.ValidateDateData(namedSearch, searchRange, out var msg);

        // Assert
        result.Should().BeFalse();
        msg.Should().Contain("Neither InitialSearchDays nor EndDate are configured for");
    }

    [Fact]
    public void ValidateDateData_EndDateInThePast()
    {
        // Arrange
        var now = DateTime.UtcNow.Date;
        var namedSearch = new RequestedPriceNamedSearch
        {
            EndDate = now.AddMonths(-1),
        };

        var searchRange = new DateRange
        {
            End = now.AddMonths(-1)
        };

        // Act
        var result = RequestedPriceFlow.ValidateDateData(namedSearch, searchRange, out var msg);

        // Assert
        result.Should().BeFalse();
        msg.Should().Contain("This search is configured from");
    }

    [Fact]
    public async Task GetVirtualDestinations_WithVirtualResort_IncludesInVirtualDestinations()
    {
        // Arrange
        var now = DateTime.UtcNow.Date;
        var searchRange = new DateRange
        {
            Start = now.AddDays(-10),
            End = now.AddDays(20),
        };

        var config = new RequestedPriceConfiguration
        {
            MarketCode = "UK",
            MarketLang = "en",
            NamedSearches = [
                new RequestedPriceNamedSearchConfig {
                        NamedSearch = new RequestedPriceNamedSearch {
                            Id= "city",
                            Adults = 2,
                            Duration = 7,
                            InitialSearchDays = 10,
                            StartDate = now.AddMonths(-1),
                            EndDate = now.AddMonths(2)
                        },
                        Schedule = [
                            new DestinationSchedule {
                                Destinations = ["VRESORT1"],
                                Schedule= [
                                    new ScheduleItem {
                                         DateOfRun = new DateRange
                                        {
                                            Start = DateTimeUtc.New(2020, 1, 1),
                                            End = DateTimeUtc.New(2020, 12, 31)
                                        },
                                        SearchDateRange = searchRange
                                    }
                                ]
                            }
                        ]
                    }
            ]
        };

        InjectConfig(config);

        var virtualResort = new DestinationItem
        {
            Code = "VRESORT1",
            Type = DestinationItemType.VirtualResort,
            RelatedResorts = new[] { "RESORT1", "RESORT2" }
        };

        var capturedBucket = default(OffersBucket);
        _searchService.Setup(x => x.Search(It.IsAny<RequestedPriceNamedSearch>(), It.IsAny<List<DestinationItem>>()))
            .ReturnsAsync([new()]);

        _destinationService.Setup(service => service.GetDestinationsByCodes(It.IsAny<ICollection<string>>(), It.IsAny<bool>()))
            .ReturnsAsync([virtualResort]);

        _aggregationService.Setup(x => x.AggregateOffers(
                It.IsAny<IDictionary<RequestedPriceNamedSearch, List<OffersBucket>>>(),
                It.IsAny<ConcurrentQueue<(RequestedPriceNamedSearch, Exception)>>(),
                It.IsAny<bool>(),
                It.IsAny<int>()))
            .Callback<IDictionary<RequestedPriceNamedSearch, List<OffersBucket>>, ConcurrentQueue<(RequestedPriceNamedSearch, Exception)>, bool, int>(
                (dict, _, _, _) => capturedBucket = dict.First().Value.First())
            .Returns([]);

        var input = new RequestedPriceSyncInput
        {
            Market = "UK",
            Language = "en"
        };

        // Act
        await _sut.SyncPrices(input, config);

        // Assert
        capturedBucket.Should().NotBeNull();
        capturedBucket?.VirtualDestinations.Should().NotBeNull();
        capturedBucket?.VirtualDestinations.Should().ContainSingle(vd => vd.Code == "VRESORT1" && vd.Type == DestinationItemType.VirtualResort);
    }

    [Fact]
    public async Task GetVirtualDestinations_WithMultipleVirtualResorts_IncludesAllInVirtualDestinations()
    {
        // Arrange
        var now = DateTime.UtcNow.Date;
        var searchRange = new DateRange
        {
            Start = now.AddDays(-10),
            End = now.AddDays(20),
        };

        var config = new RequestedPriceConfiguration
        {
            MarketCode = "UK",
            MarketLang = "en",
            NamedSearches = [
                new RequestedPriceNamedSearchConfig {
                        NamedSearch = new RequestedPriceNamedSearch {
                            Id= "city",
                            Adults = 2,
                            Duration = 7,
                            InitialSearchDays = 10,
                            StartDate = now.AddMonths(-1),
                            EndDate = now.AddMonths(2)
                        },
                        Schedule = [
                            new DestinationSchedule {
                                Destinations = ["VRESORT1", "VRESORT2"],
                                Schedule= [
                                    new ScheduleItem {
                                      DateOfRun = new DateRange
                                        {
                                            Start = DateTimeUtc.New(2020, 1, 1),
                                            End = DateTimeUtc.New(2020, 12, 31)
                                        },
                                        SearchDateRange = searchRange
                                    }
                                ]
                            }
                        ]
                    }
            ]
        };
        InjectConfig(config);

        var destinations = new DestinationItem[]
        {
                    new DestinationItem
                    {
                        Code = "VRESORT1",
                        Type = DestinationItemType.VirtualResort,
                        RelatedResorts = new[] { "RESORT1", "RESORT2" }
                    },
                    new DestinationItem
                    {
                        Code = "VRESORT2",
                        Type = DestinationItemType.VirtualResort,
                        RelatedResorts = new[] { "RESORT3", "RESORT4" }
                    }
        };

        var capturedBucket = default(OffersBucket);
        _searchService.Setup(x => x.Search(It.IsAny<RequestedPriceNamedSearch>(), It.IsAny<List<DestinationItem>>()))
            .ReturnsAsync([new()]);

        _destinationService.Setup(service => service.GetDestinationsByCodes(It.IsAny<ICollection<string>>(), It.IsAny<bool>()))
            .ReturnsAsync(destinations);

        _aggregationService.Setup(x => x.AggregateOffers(
                It.IsAny<IDictionary<RequestedPriceNamedSearch, List<OffersBucket>>>(),
                It.IsAny<ConcurrentQueue<(RequestedPriceNamedSearch, Exception)>>(),
                It.IsAny<bool>(),
                It.IsAny<int>()))
            .Callback<IDictionary<RequestedPriceNamedSearch, List<OffersBucket>>, ConcurrentQueue<(RequestedPriceNamedSearch, Exception)>, bool, int>(
                (dict, _, _, _) => capturedBucket = dict.First().Value.First())
            .Returns([]);

        var input = new RequestedPriceSyncInput
        {
            Market = "UK",
            Language = "en"
        };

        // Act
        await _sut.SyncPrices(input, config);

        // Assert
        capturedBucket.Should().NotBeNull();
        capturedBucket?.VirtualDestinations.Should().NotBeNull();
        capturedBucket?.VirtualDestinations.Should().HaveCount(2);
        capturedBucket?.VirtualDestinations.Should().Contain(vd => vd.Code == "VRESORT1");
        capturedBucket?.VirtualDestinations.Should().Contain(vd => vd.Code == "VRESORT2");
    }

    [Fact]
    public async Task GetVirtualDestinations_WithNoVirtualResorts_ExcludesFromVirtualDestinations()
    {
        // Arrange
        var now = DateTime.UtcNow.Date;
        var searchRange = new DateRange
        {
            Start = now.AddDays(-10),
            End = now.AddDays(20),
        };

        var config = new RequestedPriceConfiguration
        {
            MarketCode = "UK",
            MarketLang = "en",
            NamedSearches = [
                new RequestedPriceNamedSearchConfig {
                        NamedSearch = new RequestedPriceNamedSearch {
                            Id= "city",
                            Adults = 2,
                            Duration = 7,
                            InitialSearchDays = 10,
                            StartDate = now.AddMonths(-1),
                            EndDate = now.AddMonths(2)
                        },
                        Schedule = [
                            new DestinationSchedule {
                                Destinations = ["ESBA"],
                                Schedule= [
                                    new ScheduleItem {
                                       DateOfRun = new DateRange
                                        {
                                            Start = DateTimeUtc.New(2020, 1, 1),
                                            End = DateTimeUtc.New(2020, 12, 31)
                                        },
                                        SearchDateRange = searchRange
                                    }
                                ]
                            }
                        ]
                    }
            ]
        };
        InjectConfig(config);

        var capturedBucket = default(OffersBucket);
        _searchService.Setup(x => x.Search(It.IsAny<RequestedPriceNamedSearch>(), It.IsAny<List<DestinationItem>>()))
            .ReturnsAsync([new()]);

        _destinationService.Setup(service => service.GetDestinationsByCodes(It.IsAny<ICollection<string>>(), It.IsAny<bool>()))
            .ReturnsAsync([new() { Code = "ESBA", Type = DestinationItemType.Region }]);

        _aggregationService.Setup(x => x.AggregateOffers(
                It.IsAny<IDictionary<RequestedPriceNamedSearch, List<OffersBucket>>>(),
                It.IsAny<ConcurrentQueue<(RequestedPriceNamedSearch, Exception)>>(),
                It.IsAny<bool>(),
                It.IsAny<int>()))
            .Callback<IDictionary<RequestedPriceNamedSearch, List<OffersBucket>>, ConcurrentQueue<(RequestedPriceNamedSearch, Exception)>, bool, int>(
                (dict, _, _, _) => capturedBucket = dict.First().Value.First())
            .Returns([]);

        var input = new RequestedPriceSyncInput
        {
            Market = "UK",
            Language = "en"
        };

        // Act
        await _sut.SyncPrices(input, config);

        // Assert
        capturedBucket.Should().NotBeNull();
        capturedBucket?.VirtualDestinations.Should().NotContain(vd => vd.Type == DestinationItemType.VirtualResort);
    }

    [Fact]
    public async Task GetVirtualDestinations_WithMixedDestinationTypes_OnlyIncludesVirtualTypes()
    {
        // Arrange
        var now = DateTime.UtcNow.Date;
        var searchRange = new DateRange
        {
            Start = now.AddDays(-10),
            End = now.AddDays(20),
        };

        var config = new RequestedPriceConfiguration
        {
            MarketCode = "UK",
            MarketLang = "en",
            NamedSearches = [
                new RequestedPriceNamedSearchConfig {
                        NamedSearch = new RequestedPriceNamedSearch {
                            Id= "city",
                            Adults = 2,
                            Duration = 7,
                            InitialSearchDays = 10,
                            StartDate = now.AddMonths(-1),
                            EndDate = now.AddMonths(2)
                        },
                        Schedule = [
                            new DestinationSchedule {
                                Destinations = ["ES", "VRESORT1", "ESBA"],
                                Schedule= [
                                    new ScheduleItem {
                                        DateOfRun = new DateRange
                                        {
                                            Start = DateTimeUtc.New(2020, 1, 1),
                                            End = DateTimeUtc.New(2020, 12, 31)
                                        },
                                        SearchDateRange = searchRange
                                    }
                                ]
                            }
                        ]
                    }
            ]
        };
        InjectConfig(config);

        var destinations = new DestinationItem[]
        {
                new DestinationItem
                {
                    Code = "ES",
                    Type = DestinationItemType.Country
                },
                new DestinationItem
                {
                    Code = "VRESORT1",
                    Type = DestinationItemType.VirtualResort,
                    RelatedResorts = new[] { "RESORT1" }
                },
                new DestinationItem
                {
                    Code = "ESBA",
                    Type = DestinationItemType.Region
                }
        };

        var capturedBucket = default(OffersBucket);
        _searchService.Setup(x => x.Search(It.IsAny<RequestedPriceNamedSearch>(), It.IsAny<List<DestinationItem>>()))
            .ReturnsAsync([new()]);

        _destinationService.Setup(service => service.GetDestinationsByCodes(It.IsAny<ICollection<string>>(), It.IsAny<bool>()))
            .ReturnsAsync(destinations);

        _aggregationService.Setup(x => x.AggregateOffers(
                It.IsAny<IDictionary<RequestedPriceNamedSearch, List<OffersBucket>>>(),
                It.IsAny<ConcurrentQueue<(RequestedPriceNamedSearch, Exception)>>(),
                It.IsAny<bool>(),
                It.IsAny<int>()))
            .Callback<IDictionary<RequestedPriceNamedSearch, List<OffersBucket>>, ConcurrentQueue<(RequestedPriceNamedSearch, Exception)>, bool, int>(
                (dict, _, _, _) => capturedBucket = dict.First().Value.First())
            .Returns([]);

        var input = new RequestedPriceSyncInput
        {
            Market = "UK",
            Language = "en"
        };

        // Act
        await _sut.SyncPrices(input, config);

        // Assert
        capturedBucket.Should().NotBeNull();
        capturedBucket?.VirtualDestinations.Should().NotBeNull();
        capturedBucket?.VirtualDestinations.Should().ContainSingle(vd => vd.Code == "VRESORT1" && vd.Type == DestinationItemType.VirtualResort);
        capturedBucket?.VirtualDestinations.Should().NotContain(vd => vd.Type == DestinationItemType.Country);
        capturedBucket?.VirtualDestinations.Should().NotContain(vd => vd.Type == DestinationItemType.Region);
    }
}
