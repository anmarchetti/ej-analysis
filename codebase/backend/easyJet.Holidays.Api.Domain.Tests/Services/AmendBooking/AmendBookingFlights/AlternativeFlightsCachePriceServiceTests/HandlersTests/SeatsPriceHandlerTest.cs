using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Services.AmendBooking.Flight.AlternativeFlightsCachePriceHandler;
using easyJet.Holidays.Api.Domain.Services.AmendBooking.Flight.AlternativeFlightsCachePriceHandler.Handlers;
using FluentAssertions;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.AmendBooking.AmendBookingFlights.AlternativeFlightsCachePriceServiceTests.HandlersTests
{
    public class SeatsPriceHandlerTest
    {
        private readonly ITestOutputHelper _testOutput;
        public SeatsPriceHandlerTest(ITestOutputHelper testOutput)
        {
            _testOutput = testOutput;
        }

        [Theory]
        [MemberData(nameof(UpdateAlternativeFlightWithSeatsInformationTestData))]
        public async Task UpdateAlternativeFlightWithSeatsInformationTests(
            string reason,
            decimal seatsPrice,
            List<AlternativeFlightOffer> offers,
            List<SeatMap> seatsSelection)
        {

            //Arrange
            _testOutput.WriteLine(reason);

            var _sut = new SeatsPriceHandler();

            //Act
            await _sut.Handle(new AlternativeFlightsCachePriceCalculationContext { AlternativeFlightOffers = offers, RequestOffer = new Offer { SeatSelection = seatsSelection } });

            //Assert
            offers[0].SeatsPrice.Should().Be(seatsPrice);
        }

        public static IEnumerable<object[]> UpdateAlternativeFlightWithSeatsInformationTestData()
        {
            yield return new object[]
            {
                "Booking has seats. Enrich offer with seats information.",
                50,
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
                new List<SeatMap>
                {
                    new SeatMap
                    {
                        FlightNumber = "out01",
                        Seats = new List<Seat>
                        {
                            new Seat
                            {
                                Price = 50
                            }
                        }
                    }
                }
            };
            yield return new object[]
            {
                "Booking has seats. Offer and booking has different flight. ",
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
                                    FltNo = "out03",
                                    Car = "Car03"
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
                new List<SeatMap>
                {
                    new SeatMap
                    {
                        FlightNumber = "out01",
                        Seats = new List<Seat>
                        {
                            new Seat
                            {
                                Price = 50
                            }
                        }
                    }
                }
            };
            yield return new object[]
            {
                "Booking without seats.",
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
                new List<SeatMap>()
            };
            yield return new object[]
            {
                "Booking with empty seatmap.",
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
                new List<SeatMap>
                {
                    new SeatMap { FlightNumber = "out01" }
                }
       };
        }
    }
}
