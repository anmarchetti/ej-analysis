using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Services.AmendBooking.AmendmentValidators.Utils;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.Api.Domain.Services.AmendBooking.AmendmentValidators
{
    /// <summary>
    /// Validate the amendments of the special requests.
    /// </summary>
    public class SpecialRequestValidator : ISpecialRequestValidator
    {
        private readonly ApiSettings _apiSettings;
        private readonly AtcomSettings _atcomSettings;

        public SpecialRequestValidator(IOptions<AtcomSettings> atcomSettings, IOptions<ApiSettings> apiSettings)
        {
            _atcomSettings = atcomSettings.Value ?? throw new ArgumentNullException(nameof(atcomSettings));
            _apiSettings = apiSettings.Value ?? throw new ArgumentNullException(nameof(apiSettings));
        }

        public async Task Validate(BookingResponse bookingResponse, IEnumerable<Memo> memo, AmendBookingSetting amendBookingSettings)
        {
            var totalHoursBeforeDeparture = BookingResponseValidatorUtils.TotalHoursBeforeDeparture(bookingResponse);

            if (_atcomSettings?.ChangeBooking?.AllowedStatuses?.Contains(bookingResponse.BookingStatus) == false)
            {
                //Check if ammend is allowed
                bookingResponse.AmendmentInfo.SpecialRequest = false;
                bookingResponse.AmendmentInfo.AmendBookingStatus.Add(AmendBookingStatus.SSRAmendAllowedOnyForActiveBookings);
            }

            if (!bookingResponse.Package.Accom.IsExt && !amendBookingSettings.IsEligibleToAmendSSRForDC)
            {
                // Id amend not allowed for DC
                bookingResponse.AmendmentInfo.SpecialRequest = false;
                bookingResponse.AmendmentInfo.AmendBookingStatus.Add(AmendBookingStatus.SSRAmendNotAllowedForDC);
            }

            if (!amendBookingSettings.IsAmendSpecialRequestEnabled)
            {
                // Check if ammend is allowed
                bookingResponse.AmendmentInfo.SpecialRequest = false;
                bookingResponse.AmendmentInfo.AmendBookingStatus.Add(AmendBookingStatus.SSRAmendIsDisabled);
            }

            if (totalHoursBeforeDeparture < amendBookingSettings.AmendSpecialRequestThresholdHours)
            {
                // Departure date should be less then in sitecore settings
                bookingResponse.AmendmentInfo.SpecialRequest = false;
                bookingResponse.AmendmentInfo.AmendBookingStatus.Add(AmendBookingStatus.SSRAmendDepartureDate);
            }

            if (bookingResponse.Package.Accom.IsExt)
            {
                if (!amendBookingSettings.IsEligibleToAmendSSRForHBG && _apiSettings.ExternalHotelsProviders[ExternalHotelProviders.HBG].Any(x => x == bookingResponse.Package.Accom.System))
                {
                    // If ammend not allowed for HBG
                    bookingResponse.AmendmentInfo.SpecialRequest = false;
                    bookingResponse.AmendmentInfo.AmendBookingStatus.Add(AmendBookingStatus.SSRAmmendNotAllowedForHBG);
                }

                if (!amendBookingSettings.EnableSSRAmendForDynamicInventoryHotels && _apiSettings.ExternalHotelsProviders[ExternalHotelProviders.DI].Any(x => x == bookingResponse.Package.Accom.System))
                {
                    // Check if ammend is allowed for di hotels
                    bookingResponse.AmendmentInfo.SpecialRequest = false;
                    bookingResponse.AmendmentInfo.AmendBookingStatus.Add(AmendBookingStatus.SSRAmendIsDisabledOnSiteForDIHotels);
                }
            }

            var specialRequestAmendCount = memo?.Count(memo => memo.Code == _apiSettings.AmendBookingMemo.SpecialRequestChange.Code);

            if (specialRequestAmendCount >= (amendBookingSettings.AmendSpecialRequestCount ?? 0))
            {
                // You can change special request only X times
                bookingResponse.AmendmentInfo.SpecialRequest = false;
                bookingResponse.AmendmentInfo.AmendBookingStatus.Add(AmendBookingStatus.AmendSpecialRequestDisabledByChangeCountLimit);
            }

            if (!bookingResponse.AmendmentInfo.Memo)
            {
                // You can not change special request if amending Memo was disabled
                bookingResponse.AmendmentInfo.SpecialRequest = false;
                bookingResponse.AmendmentInfo.AmendBookingStatus.Add(AmendBookingStatus.AmendMemoDisabled);
            }
        }
    }
}