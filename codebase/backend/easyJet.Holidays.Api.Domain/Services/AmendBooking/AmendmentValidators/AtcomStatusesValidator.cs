using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;

namespace easyJet.Holidays.Api.Domain.Services.AmendBooking.AmendmentValidators
{
    /// <summary>
    /// If some amendments are restricted in DisplayResponse we should add information about it.
    /// </summary>
    public class AtcomStatusesValidator : IAmendmentValidator
    {
        /// <inheritdoc />
        public Task Validate(BookingResponse bookingResponse, IEnumerable<Memo> memo, AmendBookingSetting amendBookingSettings)
        {
            //disabled or not by Atcom
            if (!bookingResponse.AmendmentInfo.Route)
            {
                bookingResponse.AmendmentInfo.AmendBookingStatus.Add(AmendBookingStatus.AmendFlightsDisabledByAtcom);
            }

            //disabled or not by Atcom
            if (!bookingResponse.AmendmentInfo.Transfer.AmendAllow)
            {
                bookingResponse.AmendmentInfo.AmendBookingStatus.Add(AmendBookingStatus.AmendTransfersDisabledByAtcom);
            }

            //disabled or not by Atcom
            if (!bookingResponse.AmendmentInfo.Transfer.DowngradeAllow)
            {
                bookingResponse.AmendmentInfo.AmendBookingStatus.Add(AmendBookingStatus.DowngradeTransfersDisabledByAtcom);
            }

            if (!bookingResponse.AmendmentInfo.Pax.AmendAllow)
            {
                bookingResponse.AmendmentInfo.AmendBookingStatus.Add(AmendBookingStatus.AmendPassengerDisabledByAtcom);
            }

            // disable change date or not
            if (!bookingResponse.AmendmentInfo.ChangeDates)
            {
                bookingResponse.AmendmentInfo.AmendBookingStatus.Add(AmendBookingStatus.ChangeDateDisableByAtcom);
            }

            if (!bookingResponse.AmendmentInfo.RoomAndBoard)
            {
                bookingResponse.AmendmentInfo.AmendBookingStatus.Add(AmendBookingStatus.AmendRoomAndBoardDisabledByAtcom);
            }

            if (!bookingResponse.AmendmentInfo.Accom)
            {
                bookingResponse.AmendmentInfo.AmendBookingStatus.Add(AmendBookingStatus.AmendHotelDisabledByAtcom);
            }

            return Task.CompletedTask;
        }
    }
}