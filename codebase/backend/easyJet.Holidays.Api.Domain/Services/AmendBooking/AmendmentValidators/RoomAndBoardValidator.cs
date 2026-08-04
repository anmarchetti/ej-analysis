using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Services.AmendBooking.AmendmentValidators.Utils;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.Api.Domain.Services.AmendBooking.AmendmentValidators
{
    /// <summary>
    /// Validation possibility of room and board amendment.
    /// </summary>
    public class RoomAndBoardValidator : IAmendmentValidator
    {
        private readonly ApiSettings _apiSettings;

        /// <summary>
        /// ctor
        /// </summary>
        /// <param name="apiSettings">Api settings.</param>
        public RoomAndBoardValidator(IOptions<ApiSettings> apiSettings)
        {
            _apiSettings = apiSettings?.Value ?? throw new ArgumentNullException(nameof(apiSettings));
        }

        ///<inheritdoc />
        public async Task Validate(BookingResponse bookingResponse, IEnumerable<Memo> memo, AmendBookingSetting amendBookingSettings)
        {
            var totalHoursBeforeDeparture = BookingResponseValidatorUtils.TotalHoursBeforeDeparture(bookingResponse);

            if (!amendBookingSettings.IsRoomAndBoardEnabled)
            {
                bookingResponse.AmendmentInfo.RoomAndBoard = false;
                bookingResponse.AmendmentInfo.AmendBookingStatus.Add(AmendBookingStatus.AmendRoomAndBoardDisabledOnSite);
            }

            if (totalHoursBeforeDeparture < amendBookingSettings.RoomAndBoardThresholdHours)
            {
                bookingResponse.AmendmentInfo.RoomAndBoard = false;
                bookingResponse.AmendmentInfo.AmendBookingStatus.Add(AmendBookingStatus.AmendRoomAndBoardDisabledByTimeBound);
            }

            if (bookingResponse.Package.Accom.Rooms.Count > 1 && !amendBookingSettings.AllowMultiRoomAmendment.Equals(true))
            {
                bookingResponse.AmendmentInfo.RoomAndBoard = false;
                bookingResponse.AmendmentInfo.AmendBookingStatus.Add(AmendBookingStatus.AmendRoomAndBoardDisabledByHavingMultipleRooms);
            }

            if (memo.Count(x =>
                    x.Code.Equals(_apiSettings.AmendBookingMemo.RoomTypeChange.Code)
                    || x.Code.Equals(_apiSettings.AmendBookingMemo.BoardTypeChange.Code)
                    || x.Code.Equals(_apiSettings.AmendBookingMemo.RoomAndBoardTypeChange.Code)) >=
                (amendBookingSettings.RoomAndBoardAmendCount ?? 0))
            {
                bookingResponse.AmendmentInfo.RoomAndBoard = false;
                bookingResponse.AmendmentInfo.AmendBookingStatus.Add(AmendBookingStatus.AmendRoomAndBoardDisabledByChangeCountLimit);
            }
        }
    }
}
