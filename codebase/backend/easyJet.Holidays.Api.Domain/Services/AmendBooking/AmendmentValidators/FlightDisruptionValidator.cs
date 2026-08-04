using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;

namespace easyJet.Holidays.Api.Domain.Services.AmendBooking.AmendmentValidators
{
    /// <summary>
    /// Booking cannot be amended if the flight has a disruption level.
    /// </summary>
    public class FlightDisruptionValidator : IAmendmentValidator
    {
        public FlightDisruptionValidator() { }

        public async Task Validate(BookingResponse bookingResponse, IEnumerable<Memo> memo, AmendBookingSetting amendBookingSettings)
        {
            if (bookingResponse.B2BData.IsDisrupted())
            {
                bookingResponse.AmendmentInfo.Pax.AmendAllow = false;
                bookingResponse.AmendmentInfo.Pax.AmendNameOnly = false;
                bookingResponse.AmendmentInfo.Seats = false;
                bookingResponse.AmendmentInfo.Route = false;
                bookingResponse.AmendmentInfo.ChangeDates = false;
                bookingResponse.AmendmentInfo.RoomAndBoard = false;

                bookingResponse.AmendmentInfo.AmendBookingStatus.Add(AmendBookingStatus.AmendPassengerDisabledByFlightDisruption);
                bookingResponse.AmendmentInfo.AmendBookingStatus.Add(AmendBookingStatus.AmendSeatsDisabledByFlightDisruption);
                bookingResponse.AmendmentInfo.AmendBookingStatus.Add(AmendBookingStatus.AmendFlightsDisabledByFlightDisruption);
                bookingResponse.AmendmentInfo.AmendBookingStatus.Add(AmendBookingStatus.ChangeDateDisabledByFlightDisruption);
                bookingResponse.AmendmentInfo.AmendBookingStatus.Add(AmendBookingStatus.AmendRoomAndBoardDisabledByFlightDisruption);
            }
        }
    }
}