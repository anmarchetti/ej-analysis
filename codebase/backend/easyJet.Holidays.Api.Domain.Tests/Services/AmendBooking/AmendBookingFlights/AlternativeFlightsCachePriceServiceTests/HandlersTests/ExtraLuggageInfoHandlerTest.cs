using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Interfaces.Promotions;
using easyJet.Holidays.Api.Domain.Services.AmendBooking.Flight.AlternativeFlightsCachePriceHandler;
using easyJet.Holidays.Api.Domain.Services.AmendBooking.Flight.AlternativeFlightsCachePriceHandler.Handlers;
using FluentAssertions;
using Moq;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.AmendBooking.AmendBookingFlights.AlternativeFlightsCachePriceServiceTests.HandlersTests
{
    public class ExtraLuggageInfoHandlerTest
    {
        private readonly ITestOutputHelper _testOutput;
        private readonly Mock<IPromotionValidatorService> _promotionValidatorService = new();
        public ExtraLuggageInfoHandlerTest(ITestOutputHelper testOutput)
        {
            _testOutput = testOutput;

        }

        [Theory]
        [MemberData(nameof(UpdateAlternativeFlightPriceWithExtraLuggageInfoTestData))]
        public async Task UpdateAlternativeFlightPriceWithPromoCodesTests(
            string reason,
            decimal discountAmount,
            List<AlternativeFlightOffer> offers,
            Offer offer)
        {
            //Arrange
            _testOutput.WriteLine(reason);

            var _sut = new ExtraLuggageInfoHandler();

            //Act
            await _sut.Handle(new AlternativeFlightsCachePriceCalculationContext
            {
                RequestOffer = offer,
                AlternativeFlightOffers = offers
            });

            //Assert
            offers[0].ExtraLuggagePrice.Should().Be(discountAmount);
        }
        public static IEnumerable<object[]> UpdateAlternativeFlightPriceWithExtraLuggageInfoTestData()
        {
            yield return new object[]
            {
                "Booking has empty EL",
                0,
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
                new Offer()
                {
                    ExtraLuggageInfo = new ExtraLuggageInfo
                    {

                    }
                }
            };
            yield return new object[]
{
                "Booking has no EL.",
                0,
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
                new Offer()
                {
                }
};
            yield return new object[]
            {
                "Booking has EL but route is internal.",
                0,
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
                new Offer()
                {
                    ExtraLuggageInfo = new ExtraLuggageInfo
                    {
                        Items = new List<ExtraLuggageItem>
                        {
                            new ExtraLuggageItem
                            {
                                Price = 60
                            },
                            new ExtraLuggageItem
                            {
                                Price = 60
                            }
                        }
                    }
                }
            };
            yield return new object[]
            {
                "Booking has external transport. Enrich with extra luggage info price.",
                120,
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
                                    Car = "Car01",
                                    IsExternal = true,
                                },
                                new Route
                                {
                                    FltNo = "inb02",
                                    Car = "Car02",
                                    IsExternal = true,
                                }
                            }
                        }
                    }
                },
                new Offer()
                {
                    ExtraLuggageInfo = new ExtraLuggageInfo
                    {
                        Items = new List<ExtraLuggageItem>
                        {
                            new ExtraLuggageItem
                            {
                                Price = 60
                            },
                            new ExtraLuggageItem
                            {
                                Price = 60
                            }
                        }
                    }
                }
            };
        }
    }
}
