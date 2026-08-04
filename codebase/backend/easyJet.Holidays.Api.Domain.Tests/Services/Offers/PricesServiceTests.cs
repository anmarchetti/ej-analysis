using easyJet.Holidays.Api.Domain.Data;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.LivePrice;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.RequestedPrice;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Services.Offers;
using easyJet.Holidays.Api.Domain.Settings;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Offers
{

    public class RoundModel
    {
        public double DoubleProp { get; set; }
    }

    public class PriceModelImpl : IPriceModel
    {
        public decimal Price { get; set; }
        public decimal PricePP { get; set; }
        public Currency Currency { get; set; }
    }

    public class PriceTotalModelImpl : IPriceTotalModel
    {
        public decimal PricePP { get; set; }
        public decimal TotalPrice { get; set; }
    }

    public class PricesServiceTests
    {
        [Theory]
        [MemberData(nameof(RoundDoulbePriceTestData))]
        public void RoundPrice_ItemWithExpr_Rounds(string because, bool roundPrice, RoundModel item, double expected)
        {
            // Arrange
            var sut = new PricesService(Options.Create(new ApiSettings
            {
                RoundPrices = roundPrice,
            }));

            // Act
            var price = sut.RoundPrice(item.DoubleProp);

            // Assert
            price.Should().Be(expected, because);
        }

        public static IEnumerable<object[]> RoundDoulbePriceTestData()
        {
            yield return new object[] {
                "No rounding because rounding is turned off",
                false,
                new RoundModel { DoubleProp = 1.23 },
                1.23
            };

            yield return new object[] {
                "Round up",
                true,
                new RoundModel { DoubleProp = 1.23 },
                2
            };

            yield return new object[] {
                "Already rounded, no changes",
                true,
                new RoundModel { DoubleProp = 123 },
                123
            };

        }

        [Theory]
        [MemberData(nameof(RoundDoulbePriceSingleValueTestData))]
        public void RoundPrice_Double_Rounds(string because, bool roundPrice, decimal val, decimal expected)
        {
            // Arrange
            var sut = new PricesService(Options.Create(new ApiSettings
            {
                RoundPrices = roundPrice,
            }));

            // Act
            var actual = sut.RoundPrice(val);

            // Assert
            actual.Should().Be(expected, because);
        }

        public static IEnumerable<object[]> RoundDoulbePriceSingleValueTestData()
        {
            yield return new object[] {
                "No rounding because rounding is turned off",
                false,
                1.23,
                1.23
            };

            yield return new object[] {
                "Round up",
                true,
                1.23,
                2
            };

            yield return new object[] {
                "Already rounded, no changes",
                true,
                123,
                123
            };

            yield return new object[] {
                "Round down negative value",
                true,
                -123.2,
                -124
            };

        }


        [Theory]
        [MemberData(nameof(RoundPricesTestData))]
        public void RoundPrice_Items_Rounds(string because, bool roundPrice, IEnumerable<IPriceModel> items, IEnumerable<IPriceModel> expected)
        {
            // Arrange
            var listedItems = items.ToList();

            var sut = new PricesService(Options.Create(new ApiSettings
            {
                RoundPrices = roundPrice,
            }));

            // Act
            sut.RoundPrice(listedItems);

            // Assert
            listedItems.Should().BeEquivalentTo(expected, because);
        }

        public static IEnumerable<object[]> RoundPricesTestData()
        {
            yield return new object[] {
                "No rounding because rounding is turned off",
                false,
                new List<PriceModelImpl> {
                    new PriceModelImpl {
                        Price = 1.2m,
                        PricePP = 1.3m,
                        Currency = Currency.GBP,
                    }
                },
                new List<PriceModelImpl> {
                    new PriceModelImpl {
                        Price = 1.2m,
                        PricePP = 1.3m,
                        Currency = Currency.GBP,
                    }
                }
            };

            yield return new object[] {
                "Rounds prices",
                true,
                new List<PriceModelImpl> {
                    new PriceModelImpl {
                        Price = 1.2m,
                        PricePP = 1.3m,
                        Currency = Currency.GBP,
                    }
                },
                new List<PriceModelImpl> {
                    new PriceModelImpl {
                        Price = 2m,
                        PricePP = 2m,
                        Currency = Currency.GBP,
                    }
                }
            };
        }

        [Theory]
        [MemberData(nameof(RoundPriceTestData))]
        public void RoundPrice_TotalModel_Rounds(string because, bool roundPrice, IPriceTotalModel item, IPriceTotalModel expected)
        {
            // Arrange
            var sut = new PricesService(Options.Create(new ApiSettings
            {
                RoundPrices = roundPrice,
            }));

            // Act
            sut.RoundPrice(item);

            // Assert
            item.Should().BeEquivalentTo(expected, because);
        }

        public static IEnumerable<object[]> RoundPriceTestData()
        {
            yield return new object[] {
                "No rounding because rounding is turned off",
                false,
                new PriceTotalModelImpl {
                    TotalPrice = 1.2m,
                    PricePP = 1.3m
                },
                new PriceTotalModelImpl {
                    TotalPrice = 1.2m,
                    PricePP = 1.3m
                }
            };

            yield return new object[] {
                "Rounds prices",
                true,
                new PriceTotalModelImpl {
                    TotalPrice = 1.2m,
                    PricePP = 1.3m
                },
                new PriceTotalModelImpl {
                    TotalPrice = 2m,
                    PricePP = 2m
                }
            };
        }

        [Theory]
        [MemberData(nameof(RoundSearchResponseTestData))]
        public void RoundPrice_SearchResponse_Rounds(string because, bool roundPrice, SearchOffersResponse searchResponse, SearchOffersResponse expected)
        {
            // Arrange
            var sut = new PricesService(Options.Create(new ApiSettings
            {
                RoundPrices = roundPrice,
            }));

            // Act
            sut.RoundPrice(searchResponse);

            // Assert
            searchResponse.Should().BeEquivalentTo(expected, because);
        }

        public static IEnumerable<object[]> RoundSearchResponseTestData()
        {
            yield return new object[] {
                "No rounding because rounding is turned off",
                false,
                new SearchOffersResponse {
                    Status = new Status {
                        MaxPrice = 11.1m,
                        MaxPricePP = 10.65m,
                        MinPrice = 2.5m,
                        MinPricePP = 5.6m
                    },
                    Offers  = new List<Offer>{
                        new Offer {
                            Price = 1.4m,
                            PricePP = 0.75m,
                            Accom = new Accom {
                                Unit = new List<Unit> {
                                    new Unit {
                                        Price = 7.89m,
                                        PricePP = 4.2m
                                    }
                                }
                            },
                            AltBoards = new List<AltBoardType>{
                                new AltBoardType {
                                    Price = 4.5m,
                                    PricePP = 1.23m
                                }
                            },
                            Transfers = new List<TransferItem>
                            {
                                new()
                                {
                                    Price = 7.5m,
                                    PricePP = 9.12m,
                                }
                            }
                        }
                    }
                },
                new SearchOffersResponse {
                    Status = new Status {
                        MaxPrice = 11.1m,
                        MaxPricePP = 10.65m,
                        MinPrice = 2.5m,
                        MinPricePP = 5.6m
                    },
                    Offers  = new List<Offer>{
                        new Offer {
                            Price = 1.4m,
                            PricePP = 0.75m,
                            Accom = new Accom {
                                Unit = new List<Unit> {
                                    new Unit {
                                        Price = 7.89m,
                                        PricePP = 4.2m
                                    }
                                }
                            },
                            AltBoards = new List<AltBoardType>{
                                new AltBoardType {
                                    Price = 4.5m,
                                    PricePP = 1.23m
                                }
                            },
                            Transfers = new List<TransferItem>
                            {
                                new ()
                                {
                                    Price = 7.5m,
                                    PricePP = 9.12m,
                                }
                            }
                        }
                    }
                },
            };

            yield return new object[] {
                "Rounds up all prices",
                true,
                new SearchOffersResponse {
                    Status = new Status {
                        MaxPrice = 11.1m,
                        MaxPricePP = 10.65m,
                        MinPrice = 2.5m,
                        MinPricePP = 5.6m
                    },
                    Offers  = new List<Offer>{
                        new Offer {
                            Price = 1.4m,
                            PricePP = 0.75m,
                            Accom = new Accom {
                                Unit = new List<Unit> {
                                    new Unit {
                                        Price = 7.89m,
                                        PricePP = 4.2m
                                    }
                                }
                            },
                            AltBoards = new List<AltBoardType>{
                                new AltBoardType {
                                    Price = 4.5m,
                                    PricePP = 1.23m
                                }
                            },
                            Transfers = new List<TransferItem>
                            {
                                new ()
                                {
                                    Price = 7.5m,
                                    PricePP = 9.12m,
                                }
                            }
                        }
                    }
                },
                new SearchOffersResponse {
                    Status = new Status {
                        MaxPrice = 12m,
                        MaxPricePP = 11m,
                        MinPrice = 3m,
                        MinPricePP = 6m
                    },
                    Offers  = new List<Offer>{
                        new Offer {
                            Price = 2m,
                            PricePP = 1m,
                            Accom = new Accom {
                                Unit = new List<Unit> {
                                    new Unit {
                                        Price = 8m,
                                        PricePP = 5m
                                    }
                                }
                            },
                            AltBoards = new List<AltBoardType>{
                                new AltBoardType {
                                    Price = 5m,
                                    PricePP = 2m
                                }
                            },
                            Transfers = new List<TransferItem>
                            {
                                new ()
                                {
                                    Price = 8m,
                                    PricePP = 10m,
                                }
                            }
                        }
                    }
                },
            };
        }

        [Fact]
        public void RoundPrice_NullValues_ShouldNotFail()
        {
            // Arrange
            var sut = new PricesService(Options.Create(new ApiSettings
            {
                RoundPrices = true,
            }));

            // Act
            Action act = () =>
            {
                sut.RoundPrice((IEnumerable<IPriceModel>)null);
                sut.RoundPrice((IPriceTotalModel)null);
                sut.RoundPrice((SearchOffersResponse)null);
                sut.RoundPrice((IEnumerable<Offer>)null);
                sut.RoundPrice((IEnumerable<LivePriceSummaryModel>)null);
                sut.RoundPrice((IEnumerable<RequestedPriceSummaryModel>)null);
                sut.RoundPrice((PriceCategory)null);
            };

            // Assert
            act.Should().NotThrow();
        }
    }
}
