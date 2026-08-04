using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.AlternativeFlights;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Services.AmendBooking.Flight.AlternativeFlightsCachePriceHandler;
using easyJet.Holidays.Api.Domain.Services.AmendBooking.Flight.AlternativeFlightsCachePriceHandler.Handlers;
using FluentAssertions;
using Moq;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.AmendBooking.AmendBookingFlights.AlternativeFlightsCachePriceServiceTests.HandlersTests
{
    public class CityHolidayHandlerTest
    {
        private readonly ITestOutputHelper _testOutput;
        private readonly Mock<IItemSearchService> _itemSearchServiceMock = new();

        public CityHolidayHandlerTest(ITestOutputHelper testOutput)
        {
            _testOutput = testOutput;

            _itemSearchServiceMock
                .Setup(x => x.GetExtras(It.IsAny<Offer>()))
                .ReturnsAsync(new OfferExtras
                {
                    Transfers = new List<TransferItem>
                    {
                        new TransferItem
                        {
                            Code = "JUMB011161NS",
                            Price = 10,
                            Type = TransferItemType.NoTransfer
                        },
                        new TransferItem
                        {
                            Code = "JUMB011161SS",
                            Price = 10,
                            Type = TransferItemType.Shared
                        },
                        new TransferItem
                        {
                            Code = "JUMB011161PP",
                            Price = 100,
                            Type = TransferItemType.Private
                        }
                    }
                });
        }

        [Theory]
        [MemberData(nameof(UpdateAlternativeFlightPriceForCityHolidayTestData))]
        public async Task UpdateAlternativeFlightPriceForCityHolidayTests(
            string reason,
            decimal transferPrice,
            List<AlternativeFlightOffer> offers,
            Offer offer)
        {
            //Arrange
            _testOutput.WriteLine(reason);

            var _sut = new CityHolidayHandler(_itemSearchServiceMock.Object);

            //Act
            await _sut.Handle(new AlternativeFlightsCachePriceCalculationContext
            {
                AmendFlightSearchRequest = new AmendFlightSearchRequest { Transfer = "Private" },
                AlternativeFlightOffers = offers,
                RequestOffer = offer,
                PackageTheme = PackageThemeType.City
            });

            //Assert
            offers[0].TransferPrice.Should().Be(transferPrice);
        }

        public static IEnumerable<object[]> UpdateAlternativeFlightPriceForCityHolidayTestData()
        {
            yield return new object[]
            {
                "Booking has transfer. Enrich with transfer information.",
                10,
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
                    Transfers = new List<TransferItem>
                    {
                        new TransferItem
                        {
                            Code = "JUMB011161NS",
                            Price = 10,
                            Type = TransferItemType.NoTransfer
                        }
                    }
                }
            };
            yield return new object[]
            {
                "Booking  without transfer. Transfer price is null.",
                0,
                new List<AlternativeFlightOffer>
                {
                    new AlternativeFlightOffer
                    {
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
        }
    }

}
