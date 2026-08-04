using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Services.AmendBooking.AmendmentValidators.Utils;
using easyJet.Holidays.Api.Domain.Services.Luggage;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.Api.Domain.Services.AmendBooking.AmendmentValidators
{
    /// <summary>
    /// Validation possibility of hotel amendment.
    /// </summary>
    public class HotelChangeValidator : IAmendmentValidator
    {
        private readonly ILuggageService _luggageService;
        private readonly ApiSettings _apiSettings;

        /// <summary>
        /// Constructor for DI 
        /// </summary>
        public HotelChangeValidator(ILuggageService luggageService, IOptions<ApiSettings> apiSettings)
        {
            _luggageService = luggageService;
            _apiSettings = apiSettings?.Value ?? throw new ArgumentNullException(nameof(apiSettings));
        }

        
        /// <summary>
        /// Validates possibility of hotel amendment.
        /// </summary>
        public async Task Validate(BookingResponse bookingResponse, IEnumerable<Memo> memo, AmendBookingSetting amendBookingSettings)
        {
            ArgumentNullException.ThrowIfNull(bookingResponse);
            ArgumentNullException.ThrowIfNull(amendBookingSettings);

            var totalHoursBeforeDeparture = BookingResponseValidatorUtils.TotalHoursBeforeDeparture(bookingResponse);

            if (!amendBookingSettings.IsAmendHotelEnabled)
            {
                bookingResponse.AmendmentInfo.Accom = false;
                bookingResponse.AmendmentInfo.AmendBookingStatus.Add(AmendBookingStatus.AmendHotelDisabledOnSite);
            }

            if (totalHoursBeforeDeparture < amendBookingSettings.AmendHotelThresholdHours)
            {
                bookingResponse.AmendmentInfo.Accom = false;
                bookingResponse.AmendmentInfo.AmendBookingStatus.Add(AmendBookingStatus.AmendHotelDisabledByTimeBound);
            }

            if (bookingResponse.Package.Accom.Rooms.Count > 1)
            {
                bookingResponse.AmendmentInfo.Accom = false;
                bookingResponse.AmendmentInfo.AmendBookingStatus.Add(AmendBookingStatus.AmendHotelDisabledByHavingMultipleRooms);
            }

            if (await _luggageService.ContainsSportEquipment(bookingResponse.ExtraLuggageInfo?.Items))
            {
                bookingResponse.AmendmentInfo.Accom = false;
                bookingResponse.AmendmentInfo.AmendBookingStatus.Add(AmendBookingStatus.AmendHotelDisabledBySportEquipment);
            }

            if (amendBookingSettings.AmendHotelCount is not null &&
                memo.Count(x => x.Code.Equals(_apiSettings.AmendBookingMemo.AccommodationChange.Code, StringComparison.OrdinalIgnoreCase)) >= amendBookingSettings.AmendHotelCount)
            {
                bookingResponse.AmendmentInfo.Accom = false;
                bookingResponse.AmendmentInfo.AmendBookingStatus.Add(AmendBookingStatus.AmendHotelDisabledByChangeCountLimit);
            }
        }
    }
}
