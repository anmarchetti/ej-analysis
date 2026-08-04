using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Services.AmendBooking.AmendmentValidators.Utils;
using easyJet.Holidays.Api.Domain.Services.Luggage;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.Api.Domain.Services.AmendBooking.AmendmentValidators
{
    /// <summary>
    /// Validation possibility of booking dates amendment.
    /// </summary>
    public class DatesValidator : IAmendmentValidator
    {
        private readonly ApiSettings _apiSettings;
        private readonly ILuggageService _luggageService;

        /// <summary>
        /// Constructor for DI
        /// </summary>
        public DatesValidator(IOptions<ApiSettings> apiSettings, ILuggageService luggageService)
        {
            _luggageService = luggageService;
            _apiSettings = apiSettings?.Value ?? throw new ArgumentNullException(nameof(apiSettings));
        }

        /// <inheritdoc />
        public async Task Validate(BookingResponse bookingResponse, IEnumerable<Memo> memo, AmendBookingSetting amendBookingSettings)
        {
            // validate change dates availability by sitecore settings
            if (!amendBookingSettings.IsChangeDatesEnable)
            {
                bookingResponse.AmendmentInfo.ChangeDates = false;

                bookingResponse.AmendmentInfo.AmendBookingStatus.Add(AmendBookingStatus.ChangeDateDisabledBySitecore);
            }

            //disabled by ChangeDatesThresholdHours CMS settings
            if (BookingResponseValidatorUtils.TotalHoursBeforeDeparture(bookingResponse) < amendBookingSettings.ChangeDatesThresholdHoursBeforeDeparture)
            {
                bookingResponse.AmendmentInfo.ChangeDates = false;

                bookingResponse.AmendmentInfo.AmendBookingStatus.Add(AmendBookingStatus.ChangeDateDisabledByTimeBound);
            }

            //disabled by change date amend limitation on sitecore
            if (memo.Count(x => x.Code.Equals(_apiSettings.AmendBookingMemo.HolidayDateChange.Code)) >=
                (amendBookingSettings.AmendChangeDateCount ?? 0))
            {
                bookingResponse.AmendmentInfo.ChangeDates = false;
                bookingResponse.AmendmentInfo.AmendBookingStatus.Add(AmendBookingStatus.ChangeDateDisabledByChangeCountLimit);
            }

            //disable for dc hotels
            if (!bookingResponse.Package.Accom.IsExt && !amendBookingSettings.EnableForDirectlyContractedBookings)
            {
                bookingResponse.AmendmentInfo.ChangeDates = false;
                bookingResponse.AmendmentInfo.AmendBookingStatus.Add(AmendBookingStatus.ChangeDateDisabledBySitecoreForDCHotels);
            }

            if (await _luggageService.ContainsSportEquipment(bookingResponse.ExtraLuggageInfo?.Items))
            {
                bookingResponse.AmendmentInfo.ChangeDates = false;
                bookingResponse.AmendmentInfo.AmendBookingStatus.Add(AmendBookingStatus.ChangeDateDisabledBySportEquipment);
            }

            if (bookingResponse.AirportParking != null)
            {
                bookingResponse.AmendmentInfo.ChangeDates = false;
                bookingResponse.AmendmentInfo.AmendBookingStatus.Add(AmendBookingStatus.ChangeDateDisabledByAirportParking);
            }
        }
    }
}
