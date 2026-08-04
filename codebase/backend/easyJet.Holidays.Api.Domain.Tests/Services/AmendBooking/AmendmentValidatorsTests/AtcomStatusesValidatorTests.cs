using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Services.AmendBooking.AmendmentValidators;
using FluentAssertions;
using FluentAssertions.Execution;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.AmendBooking.AmendmentValidatorsTests
{
    public class AtcomStatusesValidatorTests
    {
        private readonly AtcomStatusesValidator _sut;

        public AtcomStatusesValidatorTests()
        {
            _sut = new AtcomStatusesValidator();
        }

        [Fact]
        public async Task ValidationAmendmentsTests_DisableByAtcom()
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
                    Route = false,
                    Transfer = new AmendItem
                    {
                        AmendAllow = false,
                        DowngradeAllow = false
                    },
                    ChangeDates = false,
                    Memo = true,
                    Pax = new Pax
                    {
                        AmendAllow = false,
                        AmendNameOnly = false
                    },
                    Accom = false
                }
            };

            var memos = new List<Memo>();

            await _sut.Validate(bookingResponse, memos, null);

            var expectedStatuses = new List<AmendBookingStatus>
            {
                 AmendBookingStatus.AmendFlightsDisabledByAtcom,
                 AmendBookingStatus.AmendTransfersDisabledByAtcom,
                 AmendBookingStatus.DowngradeTransfersDisabledByAtcom,
                 AmendBookingStatus.AmendPassengerDisabledByAtcom,
                 AmendBookingStatus.ChangeDateDisableByAtcom,
                 AmendBookingStatus.AmendRoomAndBoardDisabledByAtcom,
                 AmendBookingStatus.AmendHotelDisabledByAtcom
            };

            using (new AssertionScope())
            {
                bookingResponse.AmendmentInfo.AmendBookingStatus.Should().BeEquivalentTo(expectedStatuses);

                bookingResponse.AmendmentInfo.Route.Should().Be(false);
                bookingResponse.AmendmentInfo.Transfer.AmendAllow.Should().Be(false);
                bookingResponse.AmendmentInfo.Transfer.DowngradeAllow.Should().Be(false);
                bookingResponse.AmendmentInfo.Pax.AmendAllow.Should().Be(false);
                bookingResponse.AmendmentInfo.Pax.AmendNameOnly.Should().Be(false);
                bookingResponse.AmendmentInfo.Seats.Should().Be(false);
            }
        }
    }
}