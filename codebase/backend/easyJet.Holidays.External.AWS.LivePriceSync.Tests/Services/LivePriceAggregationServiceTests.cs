using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.LivePrice;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.External.AWS.LivePriceSync.Models;
using easyJet.Holidays.External.AWS.LivePriceSync.Services;
using FluentAssertions;
using FluentAssertions.Execution;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.AWS.LivePriceSync.Tests.Services
{
    public class LivePriceAggregationServiceTests
    {
        private readonly LivePriceAggregationService _sut;

    private static void PopulatePriceExcludingTouristTax(Dictionary<string, GeogPricesModel> geogPrices)
    {
        foreach (var model in geogPrices.Values)
        {
            foreach (var summary in model.Summaries)
            {
                summary.PriceExcludingTouristTax = summary.Price - summary.TouristTax;
                summary.PricePPExcludingTouristTax = summary.PricePP - summary.TouristTaxPP;
            }

            foreach (var price in model.NamedSearchPrices)
            {
                price.PriceExcludingTouristTax = price.Price - price.TouristTax;
                price.PricePPExcludingTouristTax = price.PricePP - price.TouristTaxPP;
            }
        }
    }

        public LivePriceAggregationServiceTests()
        {
            Mock<ILogger<LivePriceAggregationService>> loggerMock = new();

            _sut = new LivePriceAggregationService(loggerMock.Object);
        }

        private Offer BuildOffer(string packageId, string giataCode, string cty1, string cty2, string cty3, string accomCode, decimal price, string outboundDepPt, string inboundDepPt, DateTime date, Currency touristTaxCurrency = null)
        {
            return new Offer
            {
                Date = date,
                Accom = new()
                {
                    PackageId = packageId,
                    Country = cty1,
                    Region = cty2,
                    Resort = cty3,
                    Code = accomCode,
                },
                Price = price,
                TouristTaxCurrency = touristTaxCurrency ?? Currency.NoTax,
                Transport = new()
                {
                    Routes = [
                        new() { Direction = Direction.Outbound, DepPt = outboundDepPt },
                        new() { Direction = Direction.Inbound, DepPt = inboundDepPt }]
                },
                Transfers = [],
                GiataCode = giataCode
            };
        }

        [Fact]
        public void AggregateOffers_TwoSearches_MultipleCountries_BuildModelWithMinimalPrice()
        {
            // Arrange
            var cityOffers = new List<OffersBucket> {
                {
                    new OffersBucket
                    {
                        Offers = new List<Offer> {
                            BuildOffer("0000000001/1/0001/1", "1111111", "ES","ESAA", "ESAAAA", "ESAAAA-01", 100, "LTN", "TNF", new DateTime(2020, 02, 12)),
                            BuildOffer("0000000001/1/0001/1", "3333333", "ES","ESAA", "ESAAAA", "ESAAAA-02", 99, "LGW", "TNF", new DateTime(2020, 02, 13))
                        },
                        Range = new DateRange
                        {
                            Start = new DateTimeOffset(2020, 2, 1, 0, 0, 0, TimeSpan.Zero),
                            End = new DateTimeOffset(2020, 2, 5, 0, 0, 0, TimeSpan.Zero)
                        }
                    }
                }
            };

            var beachOffers = new List<OffersBucket> {
                {
                    new OffersBucket
                    {
                        Offers = new List<Offer> {
                            BuildOffer("0000000001/1/0001/1", "3333333", "ES","ESAA", "ESAAAA", "ESAAAA-02", 60, "LTN", "TNF", new DateTime(2020, 02, 14)),
                            BuildOffer("0000000001/1/0001/1", "4444444", "ES","ESBB", "ESBBAA", "ESBBAA-01", 90, "LTN", "TNF", new DateTime(2020, 02, 15)),
                            BuildOffer("0000000001/1/0001/1", "5555555", "GR","GRAA", "GRAAAA", "GRAAAA-01", 280, "BCN", "TNF", new DateTime(2020, 02, 16)),
                        },
                        Range = new DateRange
                        {
                            Start = new DateTimeOffset(2020, 2, 6, 0, 0, 0, TimeSpan.Zero),
                            End = new DateTimeOffset(2020, 2, 10, 0, 0, 0, TimeSpan.Zero)
                        }
                    }
                }
            };

            var city = "city";
            var beach = "beach";

            // Act
            var result = _sut.AggregateOffers(new MarketInfo { Currency = "GBP", MarketCode = "EN" },
                new Dictionary<NamedSearch, List<OffersBucket>> {
                    { new NamedSearch() { Name = city, Language = "en"}, cityOffers },
                    { new NamedSearch() { Name = beach, Language = "en"}, beachOffers },
                }, new List<(NamedSearch Search, Exception Exc)>()
            );

            // Assert
            var expected = new Dictionary<string, GeogPricesModel> {
                {
                    "ES",
                    new GeogPricesModel {
                        Summaries = [ new LivePriceSummaryModel {
                            PackageId = "0000000001/1/0001/1",
                            Geog = "ES",
                            Price = 60,
                            Currency = "GBP",
                            Market = "EN",
                            Language = "en",
                            AccomCode = "ESAAAA-02",
                            SearchCriteria = new SearchCriteria {
                                Name = beach,
                                Language = "en",
                                Range = new DateRange
                                {
                                    Start = new DateTimeOffset(2020, 2, 6, 0, 0, 0, TimeSpan.Zero),
                                    End = new DateTimeOffset(2020, 2, 10, 0, 0, 0, TimeSpan.Zero)
                                }
                            },
                            NamedSearches = new Dictionary<string, decimal> {
                                { city, 99},
                                { beach, 60}
                            },
                            Transfers = new List<TransferItem>(),
                            OutboundAirport = "LTN",
                            InboundAirport = "TNF"
                        } ],
                        NamedSearchPrices = new List<LivePriceModel> {
                            new LivePriceModel {
                                PackageId = "0000000001/1/0001/1",
                                Geog = "ES",
                                AccomCode = "ESAAAA-02",
                                SearchCriteria = new SearchCriteria() {
                                    Name = city,
                                    Language = "en",
                                    Range = new DateRange
                                    {
                                        Start = new DateTimeOffset(2020, 2, 1, 0, 0, 0, TimeSpan.Zero),
                                        End = new DateTimeOffset(2020, 2, 5, 0, 0, 0, TimeSpan.Zero)
                                    }
                                },
                                Price = 99,
                                Currency = "GBP",
                                Market = "EN",
                                Language = "en",
                                Transfers = new List<TransferItem>(),
                                OutboundAirport = "LGW",
                                InboundAirport = "TNF"
                            },
                            new LivePriceModel {
                                PackageId = "0000000001/1/0001/1",
                                Geog = "ES",
                                AccomCode = "ESAAAA-02",
                                SearchCriteria = new SearchCriteria() {
                                    Name = beach,
                                    Language = "en",
                                    Range = new DateRange
                                    {
                                        Start = new DateTimeOffset(2020, 2, 6, 0, 0, 0, TimeSpan.Zero),
                                        End = new DateTimeOffset(2020, 2, 10, 0, 0, 0, TimeSpan.Zero)
                                    }
                                },
                                Price = 60,
                                Currency = "GBP",
                                Market = "EN",
                                Language = "en",
                                Transfers = new List<TransferItem>(),
                                OutboundAirport = "LTN",
                                InboundAirport = "TNF"
                            }
                        }
                    }
                },
                {
                    "ESAA",
                    new GeogPricesModel {
                        Summaries = [ new LivePriceSummaryModel {
                            PackageId = "0000000001/1/0001/1",
                            Geog = "ESAA",
                            Price = 60,
                            Currency = "GBP",
                            Market = "EN",
                            Language = "en",
                            AccomCode = "ESAAAA-02",
                            SearchCriteria = new SearchCriteria {
                                Name = beach,
                                Language = "en",
                                Range = new DateRange
                                {
                                    Start = new DateTimeOffset(2020, 2, 6, 0, 0, 0, TimeSpan.Zero),
                                    End = new DateTimeOffset(2020, 2, 10, 0, 0, 0, TimeSpan.Zero)
                                }
                            },
                            NamedSearches = new Dictionary<string, decimal> {
                                { city, 99},
                                { beach, 60}
                            },
                            Transfers = new List<TransferItem>(),
                            OutboundAirport = "LTN",
                            InboundAirport = "TNF"
                        } ],
                        NamedSearchPrices = new List<LivePriceModel> {
                            new LivePriceModel {
                                PackageId = "0000000001/1/0001/1",
                                Geog = "ESAA",
                                AccomCode = "ESAAAA-02",
                                SearchCriteria = new SearchCriteria() { Name = city, Language = "en" },
                                Price = 99,
                                Currency = "GBP",
                                Market = "EN",
                                Language = "en",
                                Transfers = new List<TransferItem>(),
                                OutboundAirport = "LGW",
                                InboundAirport = "TNF"
                            },
                            new LivePriceModel {
                                PackageId = "0000000001/1/0001/1",
                                Geog = "ESAA",
                                AccomCode = "ESAAAA-02",
                                SearchCriteria = new SearchCriteria() {
                                    Name = beach,
                                    Language = "en",
                                    Range = new DateRange
                                    {
                                        Start = new DateTimeOffset(2020, 2, 6, 0, 0, 0, TimeSpan.Zero),
                                        End = new DateTimeOffset(2020, 2, 10, 0, 0, 0, TimeSpan.Zero)
                                    }
                                },
                                Price = 60,
                                Currency = "GBP",
                                Market = "EN",
                                Language = "en",
                                Transfers = new List<TransferItem>(),
                                OutboundAirport = "LTN",
                                InboundAirport = "TNF"
                            }
                        }
                    }
                },
                {
                    "ESAAAA",
                    new GeogPricesModel {
                        Summaries = [ new LivePriceSummaryModel {
                            PackageId = "0000000001/1/0001/1",
                            Geog = "ESAAAA",
                            Price = 60,
                            Currency = "GBP",
                            Market = "EN",
                            Language = "en",
                            AccomCode = "ESAAAA-02",
                            SearchCriteria = new SearchCriteria { Name = beach, Language = "en"},
                            NamedSearches = new Dictionary<string, decimal> {
                                { city, 99},
                                { beach, 60}
                            },
                            Transfers = new List<TransferItem>(),
                            OutboundAirport = "LTN",
                            InboundAirport = "TNF"
                        } ],
                        NamedSearchPrices = new List<LivePriceModel> {
                            new LivePriceModel {
                                PackageId = "0000000001/1/0001/1",
                                Geog = "ESAAAA",
                                AccomCode = "ESAAAA-02",
                                SearchCriteria = new SearchCriteria() { Name = city, Language = "en"},
                                Price = 99,
                                Currency = "GBP",
                                Market = "EN",
                                Language = "en",
                                Transfers = new List<TransferItem>(),
                                OutboundAirport = "LGW",
                                InboundAirport = "TNF"
                            },
                            new LivePriceModel {
                                PackageId = "0000000001/1/0001/1",
                                Geog = "ESAAAA",
                                AccomCode = "ESAAAA-02",
                                SearchCriteria = new SearchCriteria() { Name = beach, Language = "en"},
                                Price = 60,
                                Currency = "GBP",
                                Market = "EN",
                                Language = "en",
                                Transfers = new List<TransferItem>(),
                                OutboundAirport = "LTN",
                                InboundAirport = "TNF"
                            }
                        }
                    }
                },
                {
                    "1111111",
                     new GeogPricesModel {
                        Summaries = [ new LivePriceSummaryModel {
                            PackageId = "0000000001/1/0001/1",
                            Geog = "1111111",
                            Price = 100,
                            Currency = "GBP",
                            Market = "EN",
                            Language = "en",
                            AccomCode = "ESAAAA-01",
                            SearchCriteria = new SearchCriteria { Name = city, Language = "en"},
                            NamedSearches = new Dictionary<string, decimal> {
                                { city, 100}
                            },
                            Transfers = new List<TransferItem>(),
                            OutboundAirport = "LTN",
                            InboundAirport = "TNF"
                        } ],
                        NamedSearchPrices = new List<LivePriceModel> {
                            new LivePriceModel {
                                PackageId = "0000000001/1/0001/1",
                                Geog = "1111111",
                                AccomCode = "ESAAAA-01",
                                SearchCriteria =new SearchCriteria() { Name = city, Language = "en"},
                                Price = 100,
                                Currency = "GBP",
                                Market = "EN",
                                Language = "en",
                                Transfers = new List<TransferItem>(),
                                OutboundAirport = "LTN",
                                InboundAirport = "TNF"
                            }
                        }
                    }
                },
                {
                    "3333333",
                     new GeogPricesModel {
                        Summaries = [ new LivePriceSummaryModel {
                            PackageId = "0000000001/1/0001/1",
                            Geog = "3333333",
                            Price = 60,
                            Currency = "GBP",
                            Market = "EN",
                            Language = "en",
                            AccomCode = "ESAAAA-02",
                            SearchCriteria =new SearchCriteria { Name = beach, Language = "en"},
                            NamedSearches = new Dictionary<string, decimal> {
                                { city, 99},
                                { beach, 60}
                            },
                            Transfers = new List<TransferItem>(),
                            OutboundAirport = "LTN",
                            InboundAirport = "TNF"
                        } ],
                        NamedSearchPrices = new List<LivePriceModel> {
                            new LivePriceModel {
                                PackageId = "0000000001/1/0001/1",
                                Geog = "3333333",
                                AccomCode = "ESAAAA-02",
                                SearchCriteria =new SearchCriteria() { Name = city, Language = "en"},
                                Price = 99,
                                Currency = "GBP",
                                Market = "EN",
                                Language = "en",
                                Transfers = new List<TransferItem>(),
                                OutboundAirport = "LGW",
                                InboundAirport = "TNF"
                            },
                             new LivePriceModel {
                                PackageId = "0000000001/1/0001/1",
                                Geog = "3333333",
                                AccomCode = "ESAAAA-02",
                                SearchCriteria =new SearchCriteria() { Name = beach, Language = "en"},
                                Price = 60,
                                Currency = "GBP",
                                Market = "EN",
                                Language = "en",
                                Transfers = new List<TransferItem>(),
                                OutboundAirport = "LTN",
                                InboundAirport = "TNF"
                            }
                        }
                    }
                },
                {
                    "ESBB",
                    new GeogPricesModel {
                        Summaries = [ new LivePriceSummaryModel {
                            PackageId = "0000000001/1/0001/1",
                            Geog = "ESBB",
                            Price = 90,
                            Currency = "GBP",
                            Market = "EN",
                            Language = "en",
                            AccomCode = "ESBBAA-01",
                            SearchCriteria =new SearchCriteria { Name = beach, Language = "en"},
                            NamedSearches = new Dictionary<string, decimal> {
                                { beach, 90}
                            },
                            Transfers = new List<TransferItem>(),
                            OutboundAirport = "LTN",
                            InboundAirport = "TNF"
                        } ],
                        NamedSearchPrices = new List<LivePriceModel> {
                            new LivePriceModel {
                                PackageId = "0000000001/1/0001/1",
                                Geog = "ESBB",
                                AccomCode = "ESBBAA-01",
                                SearchCriteria =new SearchCriteria() { Name = beach, Language = "en"},
                                Price = 90,
                                Currency = "GBP",
                                Market = "EN",
                                Language = "en",
                                Transfers = new List<TransferItem>(),
                                OutboundAirport = "LTN",
                                InboundAirport = "TNF"
                            }
                        }
                    }
                },
                {
                    "ESBBAA",
                     new GeogPricesModel {
                        Summaries = [ new LivePriceSummaryModel {
                            PackageId = "0000000001/1/0001/1",
                            Geog = "ESBBAA",
                            Price = 90,
                            Currency = "GBP",
                            Market = "EN",
                            Language = "en",
                            AccomCode = "ESBBAA-01",
                            SearchCriteria =new SearchCriteria { Name = beach, Language = "en"},
                            NamedSearches = new Dictionary<string, decimal> {
                                { beach, 90}
                            },
                            Transfers = new List<TransferItem>(),
                            OutboundAirport = "LTN",
                            InboundAirport = "TNF"
                        } ],
                        NamedSearchPrices = new List<LivePriceModel> {
                            new LivePriceModel {
                                PackageId = "0000000001/1/0001/1",
                                Geog = "ESBBAA",
                                AccomCode = "ESBBAA-01",
                                SearchCriteria =new SearchCriteria() { Name = beach, Language = "en"},
                                Price = 90,
                                Currency = "GBP",
                                Market = "EN",
                                Language = "en",
                                Transfers = new List<TransferItem>(),
                                OutboundAirport = "LTN",
                                InboundAirport = "TNF"
                            }
                        }
                    }
                },
                {
                    "4444444",
                     new GeogPricesModel {
                        Summaries = [ new LivePriceSummaryModel {
                            PackageId = "0000000001/1/0001/1",
                            Geog = "4444444",
                            Price = 90,
                            Currency = "GBP",
                            Market = "EN",
                            Language = "en",
                            AccomCode = "ESBBAA-01",
                            SearchCriteria =new SearchCriteria { Name = beach, Language = "en"},
                            NamedSearches = new Dictionary<string, decimal> {
                                { beach, 90}
                            },
                            Transfers = new List<TransferItem>(),
                            OutboundAirport = "LTN",
                            InboundAirport = "TNF"
                        } ],
                        NamedSearchPrices = new List<LivePriceModel> {
                            new LivePriceModel {
                                PackageId = "0000000001/1/0001/1",
                                Geog = "4444444",
                                AccomCode = "ESBBAA-01",
                                SearchCriteria =new SearchCriteria() { Name = beach, Language = "en"},
                                Price = 90,
                                Currency = "GBP",
                                Market = "EN",
                                Language = "en",
                                Transfers = new List<TransferItem>(),
                                OutboundAirport = "LTN",
                                InboundAirport = "TNF"
                            }
                        }
                    }
                },
                {
                    "GR",
                    new GeogPricesModel {
                        Summaries = [ new LivePriceSummaryModel {
                            PackageId = "0000000001/1/0001/1",
                            Geog = "GR",
                            Price = 280,
                            Currency = "GBP",
                            Market = "EN",
                            Language = "en",
                            AccomCode = "GRAAAA-01",
                            SearchCriteria =new SearchCriteria { Name = beach, Language = "en"},
                            NamedSearches = new Dictionary<string, decimal> {
                                { beach, 280}
                            },
                            Transfers = new List<TransferItem>(),
                            OutboundAirport = "BCN",
                            InboundAirport = "TNF"
                        } ],
                        NamedSearchPrices = new List<LivePriceModel> {
                            new LivePriceModel {
                                PackageId = "0000000001/1/0001/1",
                                Geog = "GR",
                                AccomCode = "GRAAAA-01",
                                SearchCriteria =new SearchCriteria() { Name = beach, Language = "en"},
                                Price = 280,
                                Currency = "GBP",
                                Market = "EN",
                                Language = "en",
                                Transfers = new List<TransferItem>(),
                                OutboundAirport = "BCN",
                                InboundAirport = "TNF"
                            }
                        }
                    }
                },
                {
                    "GRAA",
                    new GeogPricesModel {
                        Summaries = [ new LivePriceSummaryModel {
                            PackageId = "0000000001/1/0001/1",
                            Geog = "GRAA",
                            Price = 280,
                            Currency = "GBP",
                            Market = "EN",
                            Language = "en",
                            AccomCode = "GRAAAA-01",
                            SearchCriteria =new SearchCriteria { Name = beach, Language = "en"},
                            NamedSearches = new Dictionary<string, decimal> {
                                { beach, 280}
                            },
                            Transfers = new List<TransferItem>(),
                            OutboundAirport = "BCN",
                            InboundAirport = "TNF"
                        } ],
                        NamedSearchPrices = new List<LivePriceModel> {
                            new LivePriceModel {
                                PackageId = "0000000001/1/0001/1",
                                Geog = "GRAA",
                                AccomCode = "GRAAAA-01",
                                SearchCriteria =new SearchCriteria() { Name = beach, Language = "en"},
                                Price = 280,
                                Currency = "GBP",
                                Market = "EN",
                                Language = "en",
                                Transfers = new List<TransferItem>(),
                                OutboundAirport = "BCN",
                                InboundAirport = "TNF"
                            }
                        }
                    }
                },
                {
                    "GRAAAA",
                     new GeogPricesModel {
                        Summaries = [ new LivePriceSummaryModel {
                            PackageId = "0000000001/1/0001/1",
                            Geog = "GRAAAA",
                            Price = 280,
                            Currency = "GBP",
                            Market = "EN",
                            Language = "en",
                            AccomCode = "GRAAAA-01",
                            SearchCriteria =new SearchCriteria { Name = beach, Language = "en"},
                            NamedSearches = new Dictionary<string, decimal> {
                                { beach, 280}
                            },
                            Transfers = new List<TransferItem>(),
                            OutboundAirport = "BCN",
                            InboundAirport = "TNF"
                        } ],
                        NamedSearchPrices = new List<LivePriceModel> {
                            new LivePriceModel {
                                PackageId = "0000000001/1/0001/1",
                                Geog = "GRAAAA",
                                AccomCode = "GRAAAA-01",
                                SearchCriteria =new SearchCriteria() { Name = beach, Language = "en"},
                                Price = 280,
                                Currency = "GBP",
                                Market = "EN",
                                Language = "en",
                                Transfers = new List<TransferItem>(),
                                OutboundAirport = "BCN",
                                InboundAirport = "TNF"
                            }
                        }
                    }
                },
                {
                    "5555555",
                     new GeogPricesModel {
                        Summaries = [ new LivePriceSummaryModel {
                            PackageId = "0000000001/1/0001/1",
                            Geog = "5555555",
                            Price = 280,
                            Currency = "GBP",
                            Market = "EN",
                            Language = "en",
                            AccomCode = "GRAAAA-01",
                            SearchCriteria =new SearchCriteria { Name = beach, Language = "en"},
                            NamedSearches = new Dictionary<string, decimal> {
                                { beach, 280}
                            },
                            Transfers = new List<TransferItem>(),
                            OutboundAirport = "BCN",
                            InboundAirport = "TNF"
                        } ],
                        NamedSearchPrices = new List<LivePriceModel> {
                            new LivePriceModel {
                                PackageId = "0000000001/1/0001/1",
                                Geog = "5555555",
                                AccomCode = "GRAAAA-01",
                                SearchCriteria =new SearchCriteria() { Name = beach, Language = "en"},
                                Price = 280,
                                Currency = "GBP",
                                Market = "EN",
                                Language = "en",
                                Transfers = new List<TransferItem>(),
                                OutboundAirport = "BCN",
                                InboundAirport = "TNF"
                            }
                        }
                    }
                }
            };
            using (new AssertionScope())
            {
                PopulatePriceExcludingTouristTax(expected);
                result.Should().BeEquivalentTo(expected);
            }

        }

        [Fact]
        public void AggregateOffers_SameCodeForCty1AndCty2_NoDuplicates()
        {
            // Arrange
            var cityOffers = new List<OffersBucket> {
                new OffersBucket {
                    Offers = new List<Offer> {
                        BuildOffer("0000000001/1/0001/1", "1111111", "ES","ESAA", "ESAA", "hotel-01", 100, "LTN", "TNF", new DateTime(2020, 02, 12))
                    },
                    Range = new DateRange {
                        Start = new DateTimeOffset(2020, 02, 03, 0,0,0,0, TimeSpan.Zero),
                        End = new DateTimeOffset(2020, 02, 05, 0,0,0,0, TimeSpan.Zero)
                    }
                }
            };

            var city = "city";
            var language = "en";

            // Act
            var result = _sut.AggregateOffers(new MarketInfo { Currency = "GBP", MarketCode = "EN" },
                new Dictionary<NamedSearch, List<OffersBucket>> {
                    { new NamedSearch() { Name = city, Language = language}, cityOffers }
                }, new List<(NamedSearch Search, Exception Exc)>()
            );

            // Assert
            var expected = new Dictionary<string, GeogPricesModel> {
                {
                    "ES",
                    new GeogPricesModel {
                        Summaries = [ new LivePriceSummaryModel {
                            PackageId = "0000000001/1/0001/1",
                            Geog = "ES",
                            Price = 100,
                            Currency = "GBP",
                            Market = "EN",
                            Language = language,
                            AccomCode = "hotel-01",
                            SearchCriteria =new SearchCriteria {
                                Name = city,
                                Language = language,
                                Range = new DateRange {
                                    Start = new DateTimeOffset(2020, 02, 03, 0,0,0,0, TimeSpan.Zero),
                                    End = new DateTimeOffset(2020, 02, 05, 0,0,0,0, TimeSpan.Zero)
                                },
                            },
                            NamedSearches = new Dictionary<string, decimal> {
                                { city, 100},
                            },
                            Transfers = new List<TransferItem>(),
                            OutboundAirport = "LTN",
                            InboundAirport = "TNF"
                        } ],
                        NamedSearchPrices = new List<LivePriceModel> {
                            new LivePriceModel {
                                PackageId = "0000000001/1/0001/1",
                                Geog = "ES",
                                AccomCode = "hotel-01",
                                SearchCriteria =new SearchCriteria() {
                                    Name = city,
                                    Language = language,
                                    Range = new DateRange {
                                        Start = new DateTimeOffset(2020, 02, 03, 0,0,0,0, TimeSpan.Zero),
                                        End = new DateTimeOffset(2020, 02, 05, 0,0,0,0, TimeSpan.Zero)
                                    }
                                },
                                Price = 100,
                                Currency = "GBP",
                                Market = "EN",
                                Language = language,
                                Transfers = new List<TransferItem>(),
                                OutboundAirport = "LTN",
                                InboundAirport = "TNF",
                            }
                        }
                    }
                },
                {
                    "ESAA",
                    new GeogPricesModel {
                        Summaries = [ new LivePriceSummaryModel {
                            PackageId = "0000000001/1/0001/1",
                            Geog = "ESAA",
                            Price = 100,
                            Currency = "GBP",
                            Market = "EN",
                            Language = language,
                            AccomCode = "hotel-01",
                            SearchCriteria =new SearchCriteria {
                                Name = city,
                                Language = language,
                                Range = new DateRange {
                                    Start = new DateTimeOffset(2020, 02, 03, 0,0,0,0, TimeSpan.Zero),
                                    End = new DateTimeOffset(2020, 02, 05, 0,0,0,0, TimeSpan.Zero)
                                }
                            },
                            NamedSearches = new Dictionary<string, decimal> {
                                { city, 100 },
                            },
                            Transfers = new List<TransferItem>(),
                            OutboundAirport = "LTN",
                            InboundAirport = "TNF",
                        } ],
                        NamedSearchPrices = new List<LivePriceModel> {
                            new LivePriceModel {
                                PackageId = "0000000001/1/0001/1",
                                Geog = "ESAA",
                                AccomCode = "hotel-01",
                                SearchCriteria =new SearchCriteria() {
                                    Name = city,
                                    Language = language,
                                    Range = new DateRange {
                                        Start = new DateTimeOffset(2020, 02, 03, 0,0,0,0, TimeSpan.Zero),
                                        End = new DateTimeOffset(2020, 02, 05, 0,0,0,0, TimeSpan.Zero)
                                    }
                                },
                                Price = 100,
                                Currency = "GBP",
                                Market = "EN",
                                Language = language,
                                Transfers = new List<TransferItem>(),
                                OutboundAirport = "LTN",
                                InboundAirport = "TNF",
                            }
                        }
                    }
                },
                {
                    "1111111",
                    new GeogPricesModel {
                        Summaries = [ new LivePriceSummaryModel {
                            PackageId = "0000000001/1/0001/1",
                            Geog = "1111111",
                            Price = 100,
                            Currency = "GBP",
                            Market = "EN",
                            Language = language,
                            AccomCode = "hotel-01",
                            SearchCriteria =new SearchCriteria {
                                Name = city,
                                Language = language,
                                Range = new DateRange {
                                        Start = new DateTimeOffset(2020, 02, 03, 0,0,0,0, TimeSpan.Zero),
                                        End = new DateTimeOffset(2020, 02, 05, 0,0,0,0, TimeSpan.Zero)
                                    }},
                            NamedSearches = new Dictionary<string, decimal> {
                                { city, 100},
                            },
                            Transfers = new List<TransferItem>(),
                            OutboundAirport = "LTN",
                            InboundAirport = "TNF",
                        } ],
                        NamedSearchPrices = new List<LivePriceModel> {
                            new LivePriceModel {
                                PackageId = "0000000001/1/0001/1",
                                Geog = "1111111",
                                AccomCode = "hotel-01",
                                SearchCriteria =new SearchCriteria()
                                {
                                    Name = city,
                                    Language = language,
                                    Range = new DateRange {
                                        Start = new DateTimeOffset(2020, 02, 03, 0,0,0,0, TimeSpan.Zero),
                                        End = new DateTimeOffset(2020, 02, 05, 0,0,0,0, TimeSpan.Zero)
                                    }},
                                Price = 100,
                                Currency = "GBP",
                                Market = "EN",
                                Language = language,
                                Transfers = new List<TransferItem>(),
                                OutboundAirport = "LTN",
                                InboundAirport = "TNF",
                            }
                        }
                    }
                }
            };

            PopulatePriceExcludingTouristTax(expected);
            result.Should().BeEquivalentTo(expected);
        }

        [Fact]
        public void AggregateOffers_InitModelField()
        {
            // Arrange
            var cityOffers = new List<OffersBucket> {
                new OffersBucket {
                    Offers = new List<Offer> {
                        BuildOffer("0000000001/1/0001/1", "1111111", "ES","ES", "ES", "hotel-01", 100, "LTN", "TNF", new DateTimeOffset(2020, 02, 12, 0, 0, 0, TimeSpan.Zero).Date)
                    },
                    Range = new DateRange {
                        Start = new DateTimeOffset(2020, 02, 03, 0,0,0,0, TimeSpan.Zero),
                        End = new DateTimeOffset(2020, 02, 05, 0,0,0,0, TimeSpan.Zero)
                    }
                }
            };

            var city = "city";
            var language = "en";

            // Act
            var result = _sut.AggregateOffers(
                new MarketInfo { Currency = "GBP", MarketCode = "EN" },
                new Dictionary<NamedSearch, List<OffersBucket>>
                {
                    {
                        new NamedSearch()
                        {
                            Name = city,
                            Language = language,
                            Adults = 2,
                            Children = 1,
                            ChildAges = ["5"],
                            Duration = 5,
                            Infants = 1,
                            ThemeTypesCodes = ["C", "CF"]
                        },
                        cityOffers
                    }
                },
                new List<(NamedSearch Search, Exception Exc)>()
            );

            // Assert
            var allSearchCriteria = result.Values.SelectMany(
                x => x.NamedSearchPrices.Select(
                    y => y.SearchCriteria).Concat(x.Summaries.Select(
                    z => z.SearchCriteria))
            );

            allSearchCriteria.ToList().ForEach(criteria =>
            {
                criteria.Name.Should().Be(city);
                criteria.Language.Should().Be(language);
                criteria.Adults.Should().Be(2);
                criteria.Children.Should().Be(1);
                criteria.ChildAges.Should().BeEquivalentTo(["5"]);
                criteria.Duration.Should().Be(5);
                criteria.Infants.Should().Be(1);
                criteria.ThemeTypesCodes.Should().BeEquivalentTo(["C", "CF"]);
                criteria.Infants.Should().Be(1);
                criteria.Range.Should().BeEquivalentTo(new DateRange
                {
                    Start = new DateTimeOffset(2020, 02, 03, 0, 0, 0, 0, TimeSpan.Zero),
                    End = new DateTimeOffset(2020, 02, 05, 0, 0, 0, 0, TimeSpan.Zero)
                });
                criteria.DepPt.Should().Be("LTN");
                criteria.Date.Should().Be(new DateTimeOffset(2020, 02, 12, 0, 0, 0, TimeSpan.Zero).Date);
            });
        }

        [Fact]
        public void AggregateOffers_TouristTaxCurrency_UsesCheapestOfferCurrency()
        {
            // Arrange
            var offers = new List<OffersBucket> {
                new OffersBucket
                {
                    Offers = new List<Offer> {
                        BuildOffer("0000000001/1/0001/1", "1111111", "ES","ESAA", "ESAAAA", "ESAAAA-01", 100, "LTN", "TNF", new DateTime(2020, 02, 12), Currency.EUR),
                        BuildOffer("0000000001/1/0001/1", "2222222", "ES","ESAA", "ESAAAA", "ESAAAA-02", 150, "LTN", "TNF", new DateTime(2020, 02, 13), Currency.CHF),
                    },
                    Range = new DateRange
                    {
                        Start = new DateTimeOffset(2020, 2, 1, 0, 0, 0, TimeSpan.Zero),
                        End = new DateTimeOffset(2020, 2, 5, 0, 0, 0, TimeSpan.Zero)
                    }
                }
            };

            // Act
            var result = _sut.AggregateOffers(new MarketInfo { Currency = "GBP", MarketCode = "EN" },
                new Dictionary<NamedSearch, List<OffersBucket>> {
                    { new NamedSearch() { Name = "city", Language = "en"}, offers }
                }, new List<(NamedSearch Search, Exception Exc)>()
            );

            // Assert
            var summary = result["ES"].Summaries.Single();
            var namedSearchPrice = result["ES"].NamedSearchPrices.Single();

            summary.Price.Should().Be(100);
            namedSearchPrice.Price.Should().Be(100);
            summary.AccomCode.Should().Be("ESAAAA-01");
            namedSearchPrice.AccomCode.Should().Be("ESAAAA-01");
        }

        [Fact]
        public void AggregateOffers_WhenNamedSearchAggregationThrows_AddsExceptionAndContinues()
        {
            // Arrange
            Mock<ILogger<LivePriceAggregationService>> loggerMock = new();
            var sut = new LivePriceAggregationService(loggerMock.Object);
            var failedSearch = new NamedSearch { Name = "broken", Language = "en" };
            var validSearch = new NamedSearch { Name = "valid", Language = "en" };

            var brokenBuckets = new List<OffersBucket>
            {
                new()
                {
                    Offers = null,
                    Range = new DateRange
                    {
                        Start = new DateTimeOffset(2020, 02, 01, 0, 0, 0, TimeSpan.Zero),
                        End = new DateTimeOffset(2020, 02, 05, 0, 0, 0, TimeSpan.Zero)
                    }
                }
            };

            var validBuckets = new List<OffersBucket>
            {
                new()
                {
                    Offers = new List<Offer>
                    {
                        BuildOffer("0000000001/1/0001/1", "1111111", "ES", "ESAA", "ESAAAA", "ESAAAA-01", 100, "LTN", "TNF", new DateTime(2020, 02, 12))
                    },
                    Range = new DateRange
                    {
                        Start = new DateTimeOffset(2020, 02, 06, 0, 0, 0, TimeSpan.Zero),
                        End = new DateTimeOffset(2020, 02, 10, 0, 0, 0, TimeSpan.Zero)
                    }
                }
            };

            var aggregationExceptions = new List<(NamedSearch Search, Exception Exc)>();

            // Act
            var result = sut.AggregateOffers(
                new MarketInfo { Currency = "GBP", MarketCode = "EN" },
                new Dictionary<NamedSearch, List<OffersBucket>>
                {
                    { failedSearch, brokenBuckets },
                    { validSearch, validBuckets }
                },
                aggregationExceptions);

            // Assert
            aggregationExceptions.Should().ContainSingle(x => x.Search == failedSearch && x.Exc is Exception);
            result.Should().ContainKey("ES");
            result["ES"].Summaries.Should().ContainSingle();
        }
    }
}
