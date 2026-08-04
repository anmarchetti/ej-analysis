using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Services.AmendBooking.AmendmentValidators.Utils;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.Api.Domain.Services.AmendBooking.AmendmentValidators
{
    /// <summary>
    /// Validating whether flight amendment is possible.
    /// </summary>
    public class FlightValidator : IAmendmentValidator
    {
        private readonly ApiSettings _apiSettings;

        public FlightValidator(IOptions<ApiSettings> apiSettings)
        {
            _apiSettings = apiSettings?.Value ?? throw new ArgumentNullException(nameof(apiSettings));
        }

        public async Task Validate(BookingResponse bookingResponse, IEnumerable<Memo> memo, AmendBookingSetting amendBookingSettings)
        {
            //disabled or not by CMS settings
            if (!amendBookingSettings.IsAmendFlightsEnabled)
            {
                bookingResponse.AmendmentInfo.Route = false;
                bookingResponse.AmendmentInfo.AmendBookingStatus.Add(AmendBookingStatus.AmendFlightsDisabledOnSite);
            }

            //disabled or not by AmendFlightsThresholdHours CMS settings (default value 72 hours)
            if (BookingResponseValidatorUtils.TotalHoursBeforeDeparture(bookingResponse) < amendBookingSettings.AmendFlightsThresholdHours)
            {
                bookingResponse.AmendmentInfo.Route = false;
                bookingResponse.AmendmentInfo.AmendBookingStatus.Add(AmendBookingStatus.AmendFlightsDisabledByTimeBound);
            }

            // can not amend booking with multiple flight
            if (bookingResponse.Package?.Transport?.Routes?.Count > 2)
            {
                bookingResponse.AmendmentInfo.Transfer.AmendAllow = false;
                bookingResponse.AmendmentInfo.Transfer.DowngradeAllow = false;
                bookingResponse.AmendmentInfo.Route = false;
                bookingResponse.AmendmentInfo.AmendBookingStatus.Add(AmendBookingStatus.AmendFlightsDisabledAsMultipleFlightsPackage);
                bookingResponse.AmendmentInfo.AmendBookingStatus.Add(AmendBookingStatus.AmendTransfersDisabledAsMultipleFlightsPackage);
            }

            // can amend flight only X times
            if (memo.Count(x => x.Code.Equals(_apiSettings.AmendBookingMemo.FlightTimeChange.Code)) >=
                (amendBookingSettings.AmendFlightCount ?? 0))
            {
                bookingResponse.AmendmentInfo.Route = false;
                bookingResponse.AmendmentInfo.AmendBookingStatus.Add(AmendBookingStatus.AmendFlightDisabledByChangeCountLimit);
            }

            if (bookingResponse.AirportParking != null)
            {
                bookingResponse.AmendmentInfo.Route = false;
                bookingResponse.AmendmentInfo.AmendBookingStatus.Add(AmendBookingStatus
                    .AmendFlightsDisabledByAirportParking);
            }
        }
    }
}