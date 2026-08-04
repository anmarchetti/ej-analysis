using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.AlternativeFlights;
using easyJet.Holidays.Api.Domain.Data.Promotion;
using easyJet.Holidays.Api.Domain.Interfaces.Promotions;
using easyJet.Holidays.Api.Domain.Services.AmendBooking.Flight.AlternativeFlightsCachePriceHandler;
using easyJet.Holidays.Api.Domain.Services.AmendBooking.Flight.AlternativeFlightsCachePriceHandler.Handlers;
using FluentAssertions;
using Moq;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.AmendBooking.AmendBookingFlights.AlternativeFlightsCachePriceServiceTests.HandlersTests
{
    public class PromocodeHandlerTest
    {
        private readonly ITestOutputHelper _testOutput;
        private readonly Mock<IPromotionValidatorService> _promotionValidatorService = new();
        public PromocodeHandlerTest(ITestOutputHelper testOutput)
        {
            _testOutput = testOutput;

        }

        [Theory]
        [MemberData(nameof(UpdateAlternativeFlightPriceWithPromoCodesTestData))]
        public async Task UpdateAlternativeFlightPriceWithPromoCodesTests(
        string reason,
        decimal discountAmount,
        AmendFlightSearchRequest searchRequest,
        List<AlternativeFlightOffer> offers,
        PromocodeDiscount promocodeDiscount)
        {
            //Arrange
            _testOutput.WriteLine(reason);

            _promotionValidatorService
                .Setup(x => x.GetPromocodeDiscountsForOffers(It.IsAny<MatchPromocodesRequestBase>()))
                .ReturnsAsync(promocodeDiscount);

            var _sut = new PromocodeHandler(_promotionValidatorService.Object);

            //Act
            await _sut.Handle(new AlternativeFlightsCachePriceCalculationContext
            {
                AmendFlightSearchRequest = searchRequest,
                AlternativeFlightOffers = offers
            });

            //Assert
            offers[0].DiscountAmount.Should().Be(discountAmount);
        }

        public static IEnumerable<object[]> UpdateAlternativeFlightPriceWithPromoCodesTestData()
        {
            yield return new object[]
            {
                "Discount does not exist.",
                0,
                new AmendFlightSearchRequest
                {
                    DiscountCode = "test",
                    Room = new List<RoomAllocation>
                    {
                        new RoomAllocation
                        {
                            Adults = 2,
                            Children = 1
                        }
                    }
                },
                new List<AlternativeFlightOffer>
                {
                    new AlternativeFlightOffer
                    {
                        Price = 10,
                        Transport = new Transport
                        {
                            Routes = new List<Route>
                            {
                                new Route
                                {
                                    FltNo = "out01",
                                    Car = "Car01"
                                },
                                new Route
                                {
                                    FltNo = "inb02",
                                    Car = "Car02"
                                }
                            }
                        }
                    }
                },
                null
            };

            yield return new object[]
            {
                "DiscountAmountPerBooking is 100. Discount amount 100.",
                100,
                new AmendFlightSearchRequest
                {
                    DiscountCode = "test",
                    Room = new List<RoomAllocation>
                    {
                        new RoomAllocation
                        {
                            Adults = 2,
                            Children = 1
                        }
                    }
                },
                new List<AlternativeFlightOffer>
                {
                    new AlternativeFlightOffer
                    {
                        Id = "Test_id",
                        Price = 10,
                        Transport = new Transport
                        {
                            Routes = new List<Route>
                            {
                                new Route
                                {
                                    FltNo = "out01",
                                    Car = "Car01"
                                },
                                new Route
                                {
                                    FltNo = "inb02",
                                    Car = "Car02"
                                }
                            }
                        }
                    }
                },
                new PromocodeDiscount
                {
                    PromocodeDiscounts = new Dictionary<string, PromocodeDiscounts>
                    {
                        {"Test_id", new PromocodeDiscounts {DiscountAmountPerBooking = 100}}
                    }
                }
            };

            yield return new object[]
            {
                "PercentageDiscountPerBooking is 10%. Discount amount 1.",
                1,
                new AmendFlightSearchRequest
                {
                    DiscountCode = "test",
                    Room = new List<RoomAllocation>
                    {
                        new RoomAllocation
                        {
                            Adults = 2,
                            Children = 1
                        }
                    }
                },
                new List<AlternativeFlightOffer>
                {
                    new AlternativeFlightOffer
                    {
                        Id = "Test_id",
                        Price = 10,
                        Transport = new Transport
                        {
                            Routes = new List<Route>
                            {
                                new Route
                                {
                                    FltNo = "out01",
                                    Car = "Car01"
                                },
                                new Route
                                {
                                    FltNo = "inb02",
                                    Car = "Car02"
                                }
                            }
                        }
                    }
                },
                new PromocodeDiscount
                {
                    PromocodeDiscounts = new Dictionary<string, PromocodeDiscounts>
                    {
                        {"Test_id", new PromocodeDiscounts {PercentageDiscountPerBooking = 10}}
                    }
                }
            };

            yield return new object[]
            {
                "AdultDiscountAmountPerPerson is 10. Adult count is 2. Discount amount 20.",
                20,
                new AmendFlightSearchRequest
                {
                    DiscountCode = "test",
                    Room = new List<RoomAllocation>
                    {
                        new RoomAllocation
                        {
                            Adults = 2,
                            Children = 1
                        }
                    }
                },
                new List<AlternativeFlightOffer>
                {
                    new AlternativeFlightOffer
                    {
                        Id = "Test_id",
                        Price = 10,
                        Transport = new Transport
                        {
                            Routes = new List<Route>
                            {
                                new Route
                                {
                                    FltNo = "out01",
                                    Car = "Car01"
                                },
                                new Route
                                {
                                    FltNo = "inb02",
                                    Car = "Car02"
                                }
                            }
                        }
                    }
                },
                new PromocodeDiscount
                {
                    PromocodeDiscounts = new Dictionary<string, PromocodeDiscounts>
                    {
                        {"Test_id", new PromocodeDiscounts {AdultDiscountAmountPerPerson = 10}}
                    }
                }
            };

            yield return new object[]
            {
                "ChildDiscountAmountPerPerson is 10. Children count is 1. Discount amount 10.",
                10,
                new AmendFlightSearchRequest
                {
                    DiscountCode = "test",
                    Room = new List<RoomAllocation>
                    {
                        new RoomAllocation
                        {
                            Adults = 2,
                            Children = 1
                        }
                    }
                },
                new List<AlternativeFlightOffer>
                {
                    new AlternativeFlightOffer
                    {
                        Id = "Test_id",
                        Price = 10,
                        Transport = new Transport
                        {
                            Routes = new List<Route>
                            {
                                new Route
                                {
                                    FltNo = "out01",
                                    Car = "Car01"
                                },
                                new Route
                                {
                                    FltNo = "inb02",
                                    Car = "Car02"
                                }
                            }
                        }
                    }
                },
                new PromocodeDiscount
                {
                    PromocodeDiscounts = new Dictionary<string, PromocodeDiscounts>
                    {
                        {"Test_id", new PromocodeDiscounts {ChildDiscountAmountPerPerson = 10}}
                    }
                }
            };

            yield return new object[]
            {
                "AdultPercentageAmountPerPerson is 10%. Adult count is 2. Discount amount 1.",
                1,
                new AmendFlightSearchRequest
                {
                    DiscountCode = "test",
                    Room = new List<RoomAllocation>
                    {
                        new RoomAllocation
                        {
                            Adults = 2,
                            Children = 1
                        }
                    }
                },
                new List<AlternativeFlightOffer>
                {
                    new AlternativeFlightOffer
                    {
                        Id = "Test_id",
                        Price = 10,
                        PricePP = 5,
                        Transport = new Transport
                        {
                            Routes = new List<Route>
                            {
                                new Route
                                {
                                    FltNo = "out01",
                                    Car = "Car01"
                                },
                                new Route
                                {
                                    FltNo = "inb02",
                                    Car = "Car02"
                                }
                            }
                        }
                    }
                },
                new PromocodeDiscount
                {
                    PromocodeDiscounts = new Dictionary<string, PromocodeDiscounts>
                    {
                        {"Test_id", new PromocodeDiscounts {AdultPercentageAmountPerPerson = 10}}
                    }
                }
            };

            yield return new object[]
            {
                "ChildPercentageAmountPerPerson is 10%. Children count is 1. Discount amount 1.",
                0.5,
                new AmendFlightSearchRequest
                {
                    DiscountCode = "test",
                    Room = new List<RoomAllocation>
                    {
                        new RoomAllocation
                        {
                            Adults = 2,
                            Children = 1
                        }
                    }
                },
                new List<AlternativeFlightOffer>
                {
                    new AlternativeFlightOffer
                    {
                        Id = "Test_id",
                        Price = 10,
                        PricePP = 5,
                        Transport = new Transport
                        {
                            Routes = new List<Route>
                            {
                                new Route
                                {
                                    FltNo = "out01",
                                    Car = "Car01"
                                },
                                new Route
                                {
                                    FltNo = "inb02",
                                    Car = "Car02"
                                }
                            }
                        }
                    }
                },
                new PromocodeDiscount
                {
                    PromocodeDiscounts = new Dictionary<string, PromocodeDiscounts>
                    {
                        {"Test_id", new PromocodeDiscounts {ChildPercentageAmountPerPerson = 10}}
                    }
                }
            };

            yield return new object[]
            {
                "Discount for current offer does not exist.",
                0,
                new AmendFlightSearchRequest
                {
                    DiscountCode = "test",
                    Room = new List<RoomAllocation>
                    {
                        new RoomAllocation
                        {
                            Adults = 2,
                            Children = 1
                        }
                    }
                },
                new List<AlternativeFlightOffer>
                {
                    new AlternativeFlightOffer
                    {
                        Id = "Test_id",
                        Price = 10,
                        PricePP = 5,
                        Transport = new Transport
                        {
                            Routes = new List<Route>
                            {
                                new Route
                                {
                                    FltNo = "out01",
                                    Car = "Car01"
                                },
                                new Route
                                {
                                    FltNo = "inb02",
                                    Car = "Car02"
                                }
                            }
                        }
                    }
                },
                new PromocodeDiscount
                {
                    PromocodeDiscounts = new Dictionary<string, PromocodeDiscounts>
                    {
                        {"Invalid id", new PromocodeDiscounts {ChildPercentageAmountPerPerson = 10}}
                    }
                }
            };
        }
    }
}
