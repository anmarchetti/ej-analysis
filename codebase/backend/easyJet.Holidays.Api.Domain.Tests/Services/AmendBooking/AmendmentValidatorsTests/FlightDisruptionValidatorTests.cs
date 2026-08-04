using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Services.AmendBooking.AmendmentValidators;
using FluentAssertions;
using FluentAssertions.Execution;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.AmendBooking.AmendmentValidatorsTests
{
    public class FlightDisruptionValidatorTests
    {
        private FlightDisruptionValidator _sut;

        [Fact]
        public async Task FlightDisruptionValidation_FlightIsDisrupted()
        {
            var bookingResponse = new BookingResponse
            {
                IsExternalAgency = false,
                Package = new BookingPackage
                {
                    Transport = new Transport
                    {
                        Routes = new List<Route>
                    {
                        new Route
                        {
                            Direction = Direction.Outbound,
                            DepDate = DateTimeOffset.Now.AddHours(1000),
                            IsSeatReservationPossible = true
                        },
                        new Route
                        {
                            Direction = Direction.Inbound,
                            DepDate = DateTimeOffset.Now.AddHours(1000),
                            IsSeatReservationPossible = true
                        }
                    }
                    },
                    Accom = new BookingAccommodation
                    {
                        IsExt = false,
                        Code = "EZY1"
                    }
                },
                AmendmentInfo = new AmendmentsInfo
                {
                    Route = true,
                    Transfer = new AmendItem
                    {
                        AmendAllow = true,
                        DowngradeAllow = true
                    },
                    ChangeDates = true,
                    Memo = true,
                    Pax = new Pax
                    {
                        AmendAllow = true,
                        AmendNameOnly = true
                    },
                    Seats = true
                }
            };

            var memos = new List<Memo>
            {

            };

            bookingResponse.B2BData = new B2BData
            {
                Passengers = new Passengers
                {
                    Passenger = new List<Passenger>
                        {
                        new Passenger
                        {
                            Itinerary = new Itinerary
                            {
                                Segment = new List<Segment>
                                {
                                    new Segment
                                    {
                                        Disruption = new Disruption
                                        {
                                            Level = "Disruption level fix"
                                        }
                                    }
                                }
                            }
                        }
                        }
                }
            };

            _sut = new FlightDisruptionValidator();

            await _sut.Validate(bookingResponse, memos, null);

            var expectedStatuses = new List<AmendBookingStatus>
            {
                AmendBookingStatus.AmendPassengerDisabledByFlightDisruption,
                AmendBookingStatus.AmendSeatsDisabledByFlightDisruption,
                AmendBookingStatus.AmendFlightsDisabledByFlightDisruption,
                AmendBookingStatus.ChangeDateDisabledByFlightDisruption,
                AmendBookingStatus.AmendRoomAndBoardDisabledByFlightDisruption
            };

            using (new AssertionScope())
            {
                bookingResponse.AmendmentInfo.AmendBookingStatus.Should().BeEquivalentTo(expectedStatuses);

                bookingResponse.AmendmentInfo.Route.Should().Be(false);
                bookingResponse.AmendmentInfo.Transfer.AmendAllow.Should().Be(true);
                bookingResponse.AmendmentInfo.Transfer.DowngradeAllow.Should().Be(true);
                bookingResponse.AmendmentInfo.Pax.AmendAllow.Should().Be(false);
                bookingResponse.AmendmentInfo.Pax.AmendNameOnly.Should().Be(false);
                bookingResponse.AmendmentInfo.Seats.Should().Be(false);
                bookingResponse.AmendmentInfo.ChangeDates.Should().Be(false);
                bookingResponse.AmendmentInfo.RoomAndBoard.Should().Be(false);
            }
        }
    }
}