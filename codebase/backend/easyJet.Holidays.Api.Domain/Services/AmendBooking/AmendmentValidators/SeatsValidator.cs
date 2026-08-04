using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Cms;
using easyJet.Holidays.Api.Domain.Services.AmendBooking.AmendmentValidators.Utils;

namespace easyJet.Holidays.Api.Domain.Services.AmendBooking.AmendmentValidators
{
    /// <summary>
    /// Validation possibility of seats amendment.
    /// </summary>
    public class SeatsValidator : IAmendmentValidator
    {
        private readonly ISettingsService _settingsService;

        public SeatsValidator(ISettingsService settingsService)
        {
            _settingsService = settingsService;
        }

        public async Task Validate(BookingResponse bookingResponse, IEnumerable<Memo> memo, AmendBookingSetting amendBookingSettings)
        {
            var outboundFlight = BookingResponseValidatorUtils.GetOutboundFlight(bookingResponse);
            var inboundFlight = BookingResponseValidatorUtils.GetInboundFlight(bookingResponse);

            var seatMapSettings = await _settingsService.GetSeatMapSettings();

            // Seats amendment disabled by Atcom
            if ((!inboundFlight?.IsSeatReservationPossible ?? true) &&
                (!outboundFlight?.IsSeatReservationPossible ?? true))
            {
                bookingResponse.AmendmentInfo.Seats = false;
                bookingResponse.AmendmentInfo.AmendBookingStatus.Add(AmendBookingStatus.AmendSeatsDisabledByAtcom);
            }

            // Seats amendment disabled in CMS
            if (!seatMapSettings.EnableSeatMapPostBookingFlow)
            {
                bookingResponse.AmendmentInfo.Seats = false;
                bookingResponse.AmendmentInfo.AmendBookingStatus.Add(AmendBookingStatus.AmendSeatsDisabledOnSite);
            }
        }
    }
}