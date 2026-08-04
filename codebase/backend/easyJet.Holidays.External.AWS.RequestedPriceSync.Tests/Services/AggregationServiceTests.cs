using Amazon.Lambda.Core;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Destinations;
using easyJet.Holidays.Api.Domain.Data.RequestedPrice;
using easyJet.Holidays.Api.Domain.Services.Market;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Atcom.Models.Extensions;
using easyJet.Holidays.External.Atcom.Models.Internal.Search;
using easyJet.Holidays.External.AWS.RequestedPriceSync.Models;
using easyJet.Holidays.External.AWS.RequestedPriceSync.Services;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.AWS.RequestedPriceSync.Tests.Services;

public class AggregationServiceTests
{
    private readonly Mock<IMarketService> _marketService;

    private readonly AggregationService _sut;

    public AggregationServiceTests()
    {
        _marketService = new Mock<IMarketService>();

        var logger = new Mock<ILogger<AggregationService>>();

        var settings = new AtcomSettings()
        {
            Transfers = new()
            {
                Types = new()
            }
        };

        _sut = new AggregationService(_marketService.Object, logger.Object, Options.Create(settings));
    }

    private AvCacheResultOffersOfferExtended BuildOffer(string cty1, string cty2, string cty3, string accomCode, decimal price, string depPt, DateTime date)
    {
        var offer = new AvCacheResultOffersOffer
        {
            Date = date,
            Accom = new[] {
                new AvCacheResultOffersOfferAccom {
                    Cty1 = cty1,
                    Cty2 = cty2,
                    Cty3 = cty3,
                    Code = accomCode,
                }
            },
            Price = price,
            Transport = new AvCacheResultOffersOfferTransport
            {
                Route = new[] {
                    new AvCacheResultOffersOfferTransportRoute {
                        Dir = AvCacheResultOffersOfferTransportRouteDir.O,
                        DepPt = depPt
                    }
                }
            }
        };
        var accom = new AvCacheResultOffersOfferAccomExtended(offer.Accom.FirstOrDefault());
        return new AvCacheResultOffersOfferExtended(offer, new[] { accom });
    }

    [Fact]
    public void AggregateOffers_SameCodeForCty1AndCty2_NoDuplicates()
    {
        // Arrange
        _marketService.Setup(x => x.GetCurrencyFromMarketCode("UK")).Returns("GBP");

        var cityOffers = new List<OffersBucket> {
            new OffersBucket {
                Offers = new List<AvCacheResultOffersOfferExtended> {
                    BuildOffer("ES","ESAA", "ESAA", "hotel-01", 100, "LTN", new DateTime(2020, 02, 12))
                },
                Range = new DateRange {
                    Start = new DateTime(2020, 02, 03, 0,0,0,0),
                    End = new DateTime(2020, 02, 05, 0,0,0,0)
                }
            }
        };

        var city = "city";

        // Act
        var result = _sut.AggregateOffers(
            new Dictionary<RequestedPriceNamedSearch, List<OffersBucket>> {
                { new RequestedPriceNamedSearch() { Id = city, MarketCode = "UK", MarketLanguage = "en"}, cityOffers }
            },
            null,
            true
        );
        city += "|UK|en";
        // Assert
        var expected = new Dictionary<string, PricesModel> {
            {
                "ES|UK|en",
                new PricesModel {
                    Summary = new RequestedPriceSummaryModel {
                        Geog = "ES|UK|en",
                        MarketCodeAndLanguage = "UK|en",
                        Currency = "GBP",
                        RequestedPriceByMathFunctions = new Dictionary<RequestedPriceMathFunctionType, RequestedPriceByMathFunctions>
                        {
                            { RequestedPriceMathFunctionType.Cheapest, new RequestedPriceByMathFunctions
                            {
                                Price = 100
                            }},
                            { RequestedPriceMathFunctionType.Average, new RequestedPriceByMathFunctions
                            {
                                Price = 100
                            }},
                            { RequestedPriceMathFunctionType.AverageInLowerQuartile, new RequestedPriceByMathFunctions
                            {
                                Price = 100
                            }},
                            { RequestedPriceMathFunctionType.HighestInLowerQuartile, new RequestedPriceByMathFunctions
                            {
                                Price = 100
                            }},
                            { RequestedPriceMathFunctionType.Medium, new RequestedPriceByMathFunctions
                            {
                                Price = 100
                            }},
                            { RequestedPriceMathFunctionType.MostExpensive, new RequestedPriceByMathFunctions
                            {
                                Price = 100
                            }},
                        },
                        SearchCriteria =new SearchCriteria {
                            Id = city,
                            Range = new DateRange {
                                Start = new DateTime(2020, 02, 03, 0,0,0,0),
                                End = new DateTime(2020, 02, 05, 0,0,0,0)
                            },
                        },
                        NamedSearches = new Dictionary<string, decimal> {
                            { city, 100},
                        },
                        Transfers = new List<TransferItem>()
                    },
                    NamedSearchPrices = new List<RequestedPriceModel> {
                        new RequestedPriceModel {
                            Geog = "ES|UK|en",
                            MarketCodeAndLanguage = "UK|en",
                            Currency = "GBP",
                            SearchCriteria =new SearchCriteria() {
                                Id = city,
                                Range = new DateRange {
                                    Start = new DateTime(2020, 02, 03, 0,0,0,0),
                                    End = new DateTime(2020, 02, 05, 0,0,0,0)
                                }
                            },
                            RequestedPriceByMathFunctions = new Dictionary<RequestedPriceMathFunctionType, RequestedPriceByMathFunctions>
                            {
                                { RequestedPriceMathFunctionType.Cheapest, new RequestedPriceByMathFunctions
                                {
                                    Price = 100
                                }},
                                { RequestedPriceMathFunctionType.Average, new RequestedPriceByMathFunctions
                                {
                                    Price = 100
                                }},
                                { RequestedPriceMathFunctionType.AverageInLowerQuartile, new RequestedPriceByMathFunctions
                                {
                                    Price = 100
                                }},
                                { RequestedPriceMathFunctionType.HighestInLowerQuartile, new RequestedPriceByMathFunctions
                                {
                                    Price = 100
                                }},
                                { RequestedPriceMathFunctionType.Medium, new RequestedPriceByMathFunctions
                                {
                                    Price = 100
                                }},
                                { RequestedPriceMathFunctionType.MostExpensive, new RequestedPriceByMathFunctions
                                {
                                    Price = 100
                                }}
                            },
                            Transfers = new List<TransferItem>()
                        }
                    }
                }
            },
            {
                "ESAA|UK|en",
                new PricesModel {
                    Summary = new RequestedPriceSummaryModel {
                        Geog = "ESAA|UK|en",
                        MarketCodeAndLanguage = "UK|en",
                        Currency = "GBP",
                        RequestedPriceByMathFunctions = new Dictionary<RequestedPriceMathFunctionType, RequestedPriceByMathFunctions>
                        {
                            { RequestedPriceMathFunctionType.Cheapest, new RequestedPriceByMathFunctions
                            {
                                Price = 100
                            }},
                            { RequestedPriceMathFunctionType.Average, new RequestedPriceByMathFunctions
                            {
                                Price = 100
                            }},
                            { RequestedPriceMathFunctionType.AverageInLowerQuartile, new RequestedPriceByMathFunctions
                            {
                                Price = 100
                            }},
                            { RequestedPriceMathFunctionType.HighestInLowerQuartile, new RequestedPriceByMathFunctions
                            {
                                Price = 100
                            }},
                            { RequestedPriceMathFunctionType.Medium, new RequestedPriceByMathFunctions
                            {
                                Price = 100
                            }},
                            { RequestedPriceMathFunctionType.MostExpensive, new RequestedPriceByMathFunctions
                            {
                                Price = 100
                            }}
                        },
                        SearchCriteria =new SearchCriteria {
                            Id = city,
                            Range = new DateRange {
                                Start = new DateTime(2020, 02, 03, 0,0,0,0),
                                End = new DateTime(2020, 02, 05, 0,0,0,0)
                            }
                        },
                        NamedSearches = new Dictionary<string, decimal> {
                            { city, 100},
                        },
                        Transfers = new List<TransferItem>()
                    },
                    NamedSearchPrices = new List<RequestedPriceModel> {
                        new RequestedPriceModel {
                            Geog = "ESAA|UK|en",
                            MarketCodeAndLanguage = "UK|en",
                            Currency = "GBP",
                            SearchCriteria =new SearchCriteria() {
                                Id = city,
                                Range = new DateRange {
                                    Start = new DateTime(2020, 02, 03, 0,0,0,0),
                                    End = new DateTime(2020, 02, 05, 0,0,0,0)
                                }
                            },
                            RequestedPriceByMathFunctions = new Dictionary<RequestedPriceMathFunctionType, RequestedPriceByMathFunctions>
                            {
                                { RequestedPriceMathFunctionType.Cheapest, new RequestedPriceByMathFunctions
                                {
                                    Price = 100
                                }},
                                { RequestedPriceMathFunctionType.Average, new RequestedPriceByMathFunctions
                                {
                                    Price = 100
                                }},
                                { RequestedPriceMathFunctionType.AverageInLowerQuartile, new RequestedPriceByMathFunctions
                                {
                                    Price = 100
                                }},
                                { RequestedPriceMathFunctionType.HighestInLowerQuartile, new RequestedPriceByMathFunctions
                                {
                                    Price = 100
                                }},
                                { RequestedPriceMathFunctionType.Medium, new RequestedPriceByMathFunctions
                                {
                                    Price = 100
                                }},
                                { RequestedPriceMathFunctionType.MostExpensive, new RequestedPriceByMathFunctions
                                {
                                    Price = 100
                                }}
                            },
                            Transfers = new List<TransferItem>()
                        }
                    }
                }
            },
            {
                "hotel-01|UK|en",
                new PricesModel {
                    Summary = new RequestedPriceSummaryModel {
                        Geog = "hotel-01|UK|en",
                        MarketCodeAndLanguage = "UK|en",
                        Currency = "GBP",
                        RequestedPriceByMathFunctions = new Dictionary<RequestedPriceMathFunctionType, RequestedPriceByMathFunctions>
                        {
                            { RequestedPriceMathFunctionType.Cheapest, new RequestedPriceByMathFunctions
                            {
                                Price = 100
                            }},
                            { RequestedPriceMathFunctionType.Average, new RequestedPriceByMathFunctions
                            {
                                Price = 100
                            }},
                            { RequestedPriceMathFunctionType.AverageInLowerQuartile, new RequestedPriceByMathFunctions
                            {
                                Price = 100
                            }},
                            { RequestedPriceMathFunctionType.HighestInLowerQuartile, new RequestedPriceByMathFunctions
                            {
                                Price = 100
                            }},
                            { RequestedPriceMathFunctionType.Medium, new RequestedPriceByMathFunctions
                            {
                                Price = 100
                            }},
                            { RequestedPriceMathFunctionType.MostExpensive, new RequestedPriceByMathFunctions
                            {
                                Price = 100
                            }}
                        },
                        SearchCriteria =new SearchCriteria { Id = city, Range = new DateRange {
                            Start = new DateTime(2020, 02, 03, 0,0,0,0),
                            End = new DateTime(2020, 02, 05, 0,0,0,0)
                        }},
                        NamedSearches = new Dictionary<string, decimal> {
                            { city, 100},
                        },
                        Transfers = new List<TransferItem>()
                    },
                    NamedSearchPrices = new List<RequestedPriceModel> {
                        new RequestedPriceModel {
                            Geog = "hotel-01|UK|en",
                            MarketCodeAndLanguage = "UK|en",
                            Currency = "GBP",
                            SearchCriteria =new SearchCriteria() { Id = city, Range = new DateRange {
                                Start = new DateTime(2020, 02, 03, 0,0,0,0),
                                End = new DateTime(2020, 02, 05, 0,0,0,0)
                            }},
                            RequestedPriceByMathFunctions = new Dictionary<RequestedPriceMathFunctionType, RequestedPriceByMathFunctions>
                            {
                                { RequestedPriceMathFunctionType.Cheapest, new RequestedPriceByMathFunctions
                                {
                                    Price = 100
                                }},
                                { RequestedPriceMathFunctionType.Average, new RequestedPriceByMathFunctions
                                {
                                    Price = 100
                                }},
                                { RequestedPriceMathFunctionType.AverageInLowerQuartile, new RequestedPriceByMathFunctions
                                {
                                    Price = 100
                                }},
                                { RequestedPriceMathFunctionType.HighestInLowerQuartile, new RequestedPriceByMathFunctions
                                {
                                    Price = 100
                                }},
                                { RequestedPriceMathFunctionType.Medium, new RequestedPriceByMathFunctions
                                {
                                    Price = 100
                                }},
                                { RequestedPriceMathFunctionType.MostExpensive, new RequestedPriceByMathFunctions
                                {
                                    Price = 100
                                }}
                            },
                            Transfers = new List<TransferItem>()
                        }
                    }
                }
            }
        };
        result.Should().BeEquivalentTo(expected);
    }

    [Fact]
    public void AggregateOffers_DisabledHotelLevel_NoHotels()
    {
        // Arrange
        _marketService.Setup(x => x.GetCurrencyFromMarketCode("UK")).Returns("GBP");

        var cityOffers = new List<OffersBucket> {
            new OffersBucket {
                Offers = new List<AvCacheResultOffersOfferExtended> {
                    BuildOffer("ES","ESAA", "ESAA", "hotel-01", 100, "LTN", new DateTime(2020, 02, 12))
                },
                Range = new DateRange {
                    Start = new DateTime(2020, 02, 03, 0,0,0,0),
                    End = new DateTime(2020, 02, 05, 0,0,0,0)
                }
            }
        };

        var city = "city";

        // Act
        var result = _sut.AggregateOffers(
            new Dictionary<RequestedPriceNamedSearch, List<OffersBucket>> {
                { new RequestedPriceNamedSearch() { Id = city, MarketCode = "UK", MarketLanguage = "en" }, cityOffers }
            },
            null
        );
        city += "|UK|en";
        // Assert
        var expected = new Dictionary<string, PricesModel> {
            {
                "ES|UK|en",
                new PricesModel {
                    Summary = new RequestedPriceSummaryModel {
                        Geog = "ES|UK|en",
                        RequestedPriceByMathFunctions = new Dictionary<RequestedPriceMathFunctionType, RequestedPriceByMathFunctions>
                        {
                            { RequestedPriceMathFunctionType.Cheapest, new RequestedPriceByMathFunctions
                            {
                                Price = 100
                            }},
                            { RequestedPriceMathFunctionType.Average, new RequestedPriceByMathFunctions
                            {
                                Price = 100
                            }},
                            { RequestedPriceMathFunctionType.AverageInLowerQuartile, new RequestedPriceByMathFunctions
                            {
                                Price = 100
                            }},
                            { RequestedPriceMathFunctionType.HighestInLowerQuartile, new RequestedPriceByMathFunctions
                            {
                                Price = 100
                            }},
                            { RequestedPriceMathFunctionType.Medium, new RequestedPriceByMathFunctions
                            {
                                Price = 100
                            }},
                            { RequestedPriceMathFunctionType.MostExpensive, new RequestedPriceByMathFunctions
                            {
                                Price = 100
                            }},
                        },
                        MarketCodeAndLanguage = "UK|en",
                        Currency = "GBP",
                        SearchCriteria =new SearchCriteria {
                            Id = city,
                            Range = new DateRange {
                                Start = new DateTime(2020, 02, 03, 0,0,0,0),
                                End = new DateTime(2020, 02, 05, 0,0,0,0)
                            },
                        },
                        NamedSearches = new Dictionary<string, decimal> {
                            { city, 100},
                        },
                        Transfers = new List<TransferItem>()
                    },
                    NamedSearchPrices = new List<RequestedPriceModel> {
                        new RequestedPriceModel {
                            Geog = "ES|UK|en",
                            MarketCodeAndLanguage = "UK|en",
                            Currency = "GBP",
                            SearchCriteria =new SearchCriteria() {
                                Id = city,
                                Range = new DateRange {
                                    Start = new DateTime(2020, 02, 03, 0,0,0,0),
                                    End = new DateTime(2020, 02, 05, 0,0,0,0)
                                }
                            },
                            RequestedPriceByMathFunctions = new Dictionary<RequestedPriceMathFunctionType, RequestedPriceByMathFunctions>
                            {
                                { RequestedPriceMathFunctionType.Cheapest, new RequestedPriceByMathFunctions
                                {
                                    Price = 100
                                }},
                                { RequestedPriceMathFunctionType.Average, new RequestedPriceByMathFunctions
                                {
                                    Price = 100
                                }},
                                { RequestedPriceMathFunctionType.AverageInLowerQuartile, new RequestedPriceByMathFunctions
                                {
                                    Price = 100
                                }},
                                { RequestedPriceMathFunctionType.HighestInLowerQuartile, new RequestedPriceByMathFunctions
                                {
                                    Price = 100
                                }},
                                { RequestedPriceMathFunctionType.Medium, new RequestedPriceByMathFunctions
                                {
                                    Price = 100
                                }},
                                { RequestedPriceMathFunctionType.MostExpensive, new RequestedPriceByMathFunctions
                                {
                                    Price = 100
                                }}
                            },
                            Transfers = new List<TransferItem>()
                        }
                    }
                }
            },
            {
                "ESAA|UK|en",
                new PricesModel {
                    Summary = new RequestedPriceSummaryModel {
                        Geog = "ESAA|UK|en",
                        MarketCodeAndLanguage = "UK|en",
                        Currency = "GBP",
                        RequestedPriceByMathFunctions = new Dictionary<RequestedPriceMathFunctionType, RequestedPriceByMathFunctions>
                        {
                            { RequestedPriceMathFunctionType.Cheapest, new RequestedPriceByMathFunctions
                            {
                                Price = 100
                            }},
                            { RequestedPriceMathFunctionType.Average, new RequestedPriceByMathFunctions
                            {
                                Price = 100
                            }},
                            { RequestedPriceMathFunctionType.AverageInLowerQuartile, new RequestedPriceByMathFunctions
                            {
                                Price = 100
                            }},
                            { RequestedPriceMathFunctionType.HighestInLowerQuartile, new RequestedPriceByMathFunctions
                            {
                                Price = 100
                            }},
                            { RequestedPriceMathFunctionType.Medium, new RequestedPriceByMathFunctions
                            {
                                Price = 100
                            }},
                            { RequestedPriceMathFunctionType.MostExpensive, new RequestedPriceByMathFunctions
                            {
                                Price = 100
                            }}
                        },
                        SearchCriteria =new SearchCriteria {
                            Id = city,
                            Range = new DateRange {
                                Start = new DateTime(2020, 02, 03, 0,0,0,0),
                                End = new DateTime(2020, 02, 05, 0,0,0,0)
                            }
                        },
                        NamedSearches = new Dictionary<string, decimal> {
                            { city, 100},
                        },
                        Transfers = new List<TransferItem>()
                    },
                    NamedSearchPrices = new List<RequestedPriceModel> {
                        new RequestedPriceModel {
                            Geog = "ESAA|UK|en",
                            MarketCodeAndLanguage = "UK|en",
                            Currency = "GBP",
                            SearchCriteria =new SearchCriteria() {
                                Id = city,
                                Range = new DateRange {
                                    Start = new DateTime(2020, 02, 03, 0,0,0,0),
                                    End = new DateTime(2020, 02, 05, 0,0,0,0)
                                }
                            },
                            RequestedPriceByMathFunctions = new Dictionary<RequestedPriceMathFunctionType, RequestedPriceByMathFunctions>
                            {
                                { RequestedPriceMathFunctionType.Cheapest, new RequestedPriceByMathFunctions
                                {
                                    Price = 100
                                }},
                                { RequestedPriceMathFunctionType.Average, new RequestedPriceByMathFunctions
                                {
                                    Price = 100
                                }},
                                { RequestedPriceMathFunctionType.AverageInLowerQuartile, new RequestedPriceByMathFunctions
                                {
                                    Price = 100
                                }},
                                { RequestedPriceMathFunctionType.HighestInLowerQuartile, new RequestedPriceByMathFunctions
                                {
                                    Price = 100
                                }},
                                { RequestedPriceMathFunctionType.Medium, new RequestedPriceByMathFunctions
                                {
                                    Price = 100
                                }},
                                { RequestedPriceMathFunctionType.MostExpensive, new RequestedPriceByMathFunctions
                                {
                                    Price = 100
                                }}
                            },
                            Transfers = new List<TransferItem>()
                        }
                    }
                }
            }
        };
        result.Should().BeEquivalentTo(expected);
    }

    [Fact]
    public void AggregateOffers_InitModelField()
    {
        // Arrange
        var cityOffers = new List<OffersBucket> {
            new OffersBucket {
                Offers = new List<AvCacheResultOffersOfferExtended> {
                    BuildOffer("ES","ES", "ES", "hotel-01", 100, "LTN", new DateTimeOffset(2020, 02, 12, 0, 0, 0, TimeSpan.Zero).Date)
                },
                Range = new DateRange {
                    Start = new DateTime(2020, 02, 03, 0,0,0,0),
                    End = new DateTime(2020, 02, 05, 0,0,0,0)
                }
            }
        };

        var city = "city";

        // Act
        var result = _sut.AggregateOffers(
            new Dictionary<RequestedPriceNamedSearch, List<OffersBucket>>()
            {
                {
                    new RequestedPriceNamedSearch()
                    {
                        Id = city,
                        Adults = 2,
                        Children = 1,
                        ChildAges = new[] { "5" },
                        Duration = 5,
                        Infants = 1,
                        ThemeTypesCodes = new[] { "C", "CF" },
                        MarketCode = "CH",
                        MarketLanguage = "fr-CH"
                    },cityOffers
                }
            }
            , null, true
        );
        city += "|CH|fr-CH";
        //Assert
        var allSearchCriterias = result.Values.SelectMany(x => x.NamedSearchPrices.Select(y => y.SearchCriteria).ToList().Concat(new List<SearchCriteria> { x.Summary.SearchCriteria }));
        allSearchCriterias.ToList().ForEach(criteria =>
        {
            criteria.Id.Should().Be(city);
            criteria.Adults.Should().Be(2);
            criteria.Children.Should().Be(1);
            criteria.ChildAges.Should().BeEquivalentTo(new[] { "5" });
            criteria.Duration.Should().Be(5);
            criteria.Infants.Should().Be(1);
            criteria.ThemeTypesCodes.Should().BeEquivalentTo(new[] { "C", "CF" });
            criteria.Infants.Should().Be(1);
            criteria.Range.Should().BeEquivalentTo(new DateRange
            {
                Start = new DateTime(2020, 02, 03, 0, 0, 0, 0),
                End = new DateTime(2020, 02, 05, 0, 0, 0, 0)
            });
            criteria.DepPt.Should().Be("LTN");
            criteria.Date.Should().Be(new DateTimeOffset(2020, 02, 12, 0, 0, 0, TimeSpan.Zero).Date);
        });
    }


    [Fact]
    public void AggregateOffers_WithVirtualResortRelatedResorts_AggregatesByRelatedResorts()
    {
        // Arrange
        _marketService.Setup(x => x.GetCurrencyFromMarketCode("UK")).Returns("GBP");

        var offers = new List<OffersBucket>
            {
                new OffersBucket
                {
                    Offers = new List<AvCacheResultOffersOfferExtended>
                    {
                        BuildOffer("ES", "ESBA", "ESBABA", "hotel-01", 100, "LTN", new DateTime(2020, 02, 12)),
                        BuildOffer("ES", "ESBA", "ESBACA", "hotel-02", 150, "LTN", new DateTime(2020, 02, 12))
                    },
                    Range = new DateRange
                    {
                        Start = new DateTime(2020, 02, 03, 0, 0, 0, 0),
                        End = new DateTime(2020, 02, 05, 0, 0, 0, 0)
                    },
                    VirtualDestinations = new List<DestinationItem>
                    {
                        new DestinationItem
                        {
                            Code = "VRESORT1",
                            Type = DestinationItemType.VirtualResort,
                            RelatedResorts = new[] { "ESBABA", "ESBACA" }
                        }
                    }
                }
            };

        var namedSearchId = "virtualResortSearch";

        // Act
        var result = _sut.AggregateOffers(
            new Dictionary<RequestedPriceNamedSearch, List<OffersBucket>>
            {
                    {
                        new RequestedPriceNamedSearch
                        {
                            Id = namedSearchId,
                            MarketCode = "UK",
                            MarketLanguage = "en"
                        },
                        offers
                    }
            },
            null
        );

        // Assert
        result.Should().ContainKey("VRESORT1|UK|en");
        var virtualResortResult = result["VRESORT1|UK|en"];
        virtualResortResult.Should().NotBeNull();
        virtualResortResult.Summary.Geog.Should().Be("VRESORT1|UK|en");
        virtualResortResult.Summary.RequestedPriceByMathFunctions[RequestedPriceMathFunctionType.Cheapest].Price.Should().Be(100);
        virtualResortResult.Summary.RequestedPriceByMathFunctions[RequestedPriceMathFunctionType.MostExpensive].Price.Should().Be(150);
    }

    [Fact]
    public void AggregateOffers_WithVirtualResortNullRelatedResorts_HandlesGracefully()
    {
        // Arrange
        _marketService.Setup(x => x.GetCurrencyFromMarketCode("UK")).Returns("GBP");

        var offers = new List<OffersBucket>
            {
                new OffersBucket
                {
                    Offers = new List<AvCacheResultOffersOfferExtended>
                    {
                        BuildOffer("ES", "ESBA", "ESBABA", "hotel-01", 100, "LTN", new DateTime(2020, 02, 12))
                    },
                    Range = new DateRange
                    {
                        Start = new DateTime(2020, 02, 03, 0, 0, 0, 0),
                        End = new DateTime(2020, 02, 05, 0, 0, 0, 0)
                    },
                    VirtualDestinations = new List<DestinationItem>
                    {
                        new DestinationItem
                        {
                            Code = "VRESORT_NULL",
                            Type = DestinationItemType.VirtualResort,
                            RelatedResorts = null
                        }
                    }
                }
            };

        var namedSearchId = "virtualResortNullSearch";

        // Act
        var result = _sut.AggregateOffers(
            new Dictionary<RequestedPriceNamedSearch, List<OffersBucket>>
            {
                    {
                        new RequestedPriceNamedSearch
                        {
                            Id = namedSearchId,
                            MarketCode = "UK",
                            MarketLanguage = "en"
                        },
                        offers
                    }
            },
            null
        );

        // Assert
        result.Should().NotBeNull();
        result.Should().ContainKey("ES|UK|en");
        result.Should().NotContainKey("VRESORT_NULL|UK|en");
    }

    [Fact]
    public void AggregateOffers_WithVirtualResortEmptyRelatedResorts_HandlesGracefully()
    {
        // Arrange
        _marketService.Setup(x => x.GetCurrencyFromMarketCode("UK")).Returns("GBP");

        var offers = new List<OffersBucket>
            {
                new OffersBucket
                {
                    Offers = new List<AvCacheResultOffersOfferExtended>
                    {
                        BuildOffer("ES", "ESBA", "ESBABA", "hotel-01", 100, "LTN", new DateTime(2020, 02, 12))
                    },
                    Range = new DateRange
                    {
                        Start = new DateTime(2020, 02, 03, 0, 0, 0, 0),
                        End = new DateTime(2020, 02, 05, 0, 0, 0, 0)
                    },
                    VirtualDestinations = new List<DestinationItem>
                    {
                        new DestinationItem
                        {
                            Code = "VRESORT_EMPTY",
                            Type = DestinationItemType.VirtualResort,
                            RelatedResorts = Array.Empty<string>()
                        }
                    }
                }
            };

        var namedSearchId = "virtualResortEmptySearch";

        // Act
        var result = _sut.AggregateOffers(
            new Dictionary<RequestedPriceNamedSearch, List<OffersBucket>>
            {
                    {
                        new RequestedPriceNamedSearch
                        {
                            Id = namedSearchId,
                            MarketCode = "UK",
                            MarketLanguage = "en"
                        },
                        offers
                    }
            },
            null
        );

        // Assert
        result.Should().NotBeNull();
        result.Should().ContainKey("ES|UK|en");
        result.Should().NotContainKey("VRESORT_EMPTY|UK|en");
    }

    [Fact]
    public void AggregateOffers_WithMultipleVirtualResortsAndRelatedRegions_AggregatesByBoth()
    {
        // Arrange
        _marketService.Setup(x => x.GetCurrencyFromMarketCode("UK")).Returns("GBP");

        var offers = new List<OffersBucket>
            {
                new OffersBucket
                {
                    Offers = new List<AvCacheResultOffersOfferExtended>
                    {
                        BuildOffer("ES", "ESBA", "ESBABA", "hotel-01", 100, "LTN", new DateTime(2020, 02, 12)),
                        BuildOffer("ES", "ESMJ", "ESMJPM", "hotel-02", 200, "LTN", new DateTime(2020, 02, 12))
                    },
                    Range = new DateRange
                    {
                        Start = new DateTime(2020, 02, 03, 0, 0, 0, 0),
                        End = new DateTime(2020, 02, 05, 0, 0, 0, 0)
                    },
                    VirtualDestinations = new List<DestinationItem>
                    {
                        new DestinationItem
                        {
                            Code = "VCOUNTRY1",
                            Type = DestinationItemType.VirtualCountry,
                            RelatedRegions = new[] { "ESBA", "ESMJ" },
                            RelatedResorts = new[] { "ESBABA", "ESMJPM" }
                        }
                    }
                }
            };

        var namedSearchId = "virtualCountrySearch";

        // Act
        var result = _sut.AggregateOffers(
            new Dictionary<RequestedPriceNamedSearch, List<OffersBucket>>
            {
                    {
                        new RequestedPriceNamedSearch
                        {
                            Id = namedSearchId,
                            MarketCode = "UK",
                            MarketLanguage = "en"
                        },
                        offers
                    }
            },
            null
        );

        // Assert
        result.Should().ContainKey("VCOUNTRY1|UK|en");
        var virtualCountryResult = result["VCOUNTRY1|UK|en"];
        virtualCountryResult.Should().NotBeNull();
        virtualCountryResult.Summary.Geog.Should().Be("VCOUNTRY1|UK|en");
        virtualCountryResult.Summary.RequestedPriceByMathFunctions[RequestedPriceMathFunctionType.Cheapest].Price.Should().Be(100);
        virtualCountryResult.Summary.RequestedPriceByMathFunctions[RequestedPriceMathFunctionType.MostExpensive].Price.Should().Be(200);
    }
}