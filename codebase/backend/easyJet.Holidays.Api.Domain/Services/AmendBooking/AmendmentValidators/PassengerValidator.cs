using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Services.AmendBooking.AmendmentValidators.Utils;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.Api.Domain.Services.AmendBooking.AmendmentValidators
{
    /// <summary>
    /// Validation possibility of passenger details amendment.
    /// </summary>
    public class PassengerValidator : IAmendmentValidator
    {
        private readonly ApiSettings _apiSettings;
        private readonly AtcomSettings _atcomSettings;

        public PassengerValidator(IOptions<ApiSettings> apiSettings, IOptions<AtcomSettings> atcomSettings)
        {
            _apiSettings = apiSettings?.Value ?? throw new ArgumentNullException(nameof(apiSettings));
            _atcomSettings = atcomSettings?.Value ?? throw new ArgumentNullException(nameof(atcomSettings));
        }

        public async Task Validate(BookingResponse bookingResponse, IEnumerable<Memo> memo, AmendBookingSetting amendBookingSettings)
        {
            var totalHoursBeforeDeparture = BookingResponseValidatorUtils.TotalHoursBeforeDeparture(bookingResponse);

            // disable by cms
            if (!amendBookingSettings.IsAmendPassengerNameEnable)
            {
                bookingResponse.AmendmentInfo.Pax.AmendAllow = false;
                bookingResponse.AmendmentInfo.Pax.AmendNameOnly = false;
                bookingResponse.AmendmentInfo.AmendBookingStatus.Add(AmendBookingStatus.AmendPassengerDisabledOnSite);
            }

            //disabled by AmendPassengerThresholdHours CMS settings
            if (totalHoursBeforeDeparture < amendBookingSettings.AmendPassengerThresholdHours)
            {
                bookingResponse.AmendmentInfo.Pax.AmendAllow = false;
                bookingResponse.AmendmentInfo.Pax.AmendNameOnly = false;
                bookingResponse.AmendmentInfo.AmendBookingStatus.Add(AmendBookingStatus.AmendPassengersDisabledByTimeBound);
            }

            if (!amendBookingSettings.EnablePassengerAmendForDynamicInventoryHotels && _apiSettings.ExternalHotelsProviders[ExternalHotelProviders.DI].Any(x => x == bookingResponse.Package.Accom.System))
            {
                bookingResponse.AmendmentInfo.Pax.AmendAllow = false;
                bookingResponse.AmendmentInfo.Pax.AmendNameOnly = false;
                bookingResponse.AmendmentInfo.AmendBookingStatus.Add(AmendBookingStatus.AmendPassengerDisabledOnSiteForDIHotels);
            }

            if (HasInventoryError(bookingResponse))
            {
                bookingResponse.AmendmentInfo.Pax.AmendAllow = false;
                bookingResponse.AmendmentInfo.Pax.AmendNameOnly = false;
                bookingResponse.AmendmentInfo.AmendBookingStatus.Add(AmendBookingStatus.AmendPassengerDisabledByInventoryError);
            }

            if (bookingResponse.AirportParking != null)
            {
                bookingResponse.AmendmentInfo.Pax.AmendAllow = false;
                bookingResponse.AmendmentInfo.Pax.AmendNameOnly = false;
                bookingResponse.AmendmentInfo.AmendBookingStatus.Add(AmendBookingStatus.AmendPassengerDisabledByAirportParking);
            }
        }

        private bool HasInventoryError(BookingResponse bookingResponse)
        {
            if (bookingResponse.ApiWarnings is null)
            {
                return false;
            }

            foreach (var warning in bookingResponse.ApiWarnings)
            {
                if (_atcomSettings.WarningCodesDisruptingAmendments?.Name?.Any(x => string.Equals(x, warning.Code, StringComparison.InvariantCultureIgnoreCase)) ?? false)
                {
                    return true;
                };
            }

            return false;
        }
    }
}