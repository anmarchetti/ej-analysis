using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Services.Authentication;
using easyJet.Holidays.Api.Domain.Services.Authentication.TradeAgent;

namespace easyJet.Holidays.Api.Domain.Services.AmendBooking.AmendmentValidators
{
    /// <summary>
    /// Authorization validation for trade agent and external customer.
    /// </summary>
    public class AuthorizationValidator : IAmendmentValidator
    {
        private readonly ITradeAgentAuthenticationService _tradeAgentAuthService;
        private readonly IAuthenticationService _authenticationService;

        /// <param name="tradeAgentAuthService">Check if user logged as trade agent.</param>
        /// <param name="authenticationService">Check if user user logged as customer.</param>
        public AuthorizationValidator(ITradeAgentAuthenticationService tradeAgentAuthService, IAuthenticationService authenticationService)
        {
            _tradeAgentAuthService = tradeAgentAuthService;
            _authenticationService = authenticationService;
        }

        /// <summary>
        /// Only trade agents can amend Trade Portal bookings
        /// Only lead passengers can amend B2C bookings
        /// </summary>
        /// <param name="bookingResponse">Booking response</param>
        public async Task Validate(BookingResponse bookingResponse, IEnumerable<Memo> memo, AmendBookingSetting amendBookingSettings)
        {
            var loggedAsBookingLeadPassenger = await _authenticationService.IsLoggedInAsLeadPax(bookingResponse.LeadPassenger?.Email);
            var loggedAsTradeAgent = _tradeAgentAuthService.IsLoggedInAsTradeAgent();

            // Only trade agents can amend Trade Portal bookings
            if (bookingResponse.IsExternalAgency && !loggedAsTradeAgent)
            {
                bookingResponse.AmendmentInfo.Route = false;
                bookingResponse.AmendmentInfo.Transfer.AmendAllow = false;
                bookingResponse.AmendmentInfo.Transfer.DowngradeAllow = false;
                bookingResponse.AmendmentInfo.Pax.AmendAllow = false;
                bookingResponse.AmendmentInfo.Pax.AmendNameOnly = false;
                bookingResponse.AmendmentInfo.Seats = false;
                bookingResponse.AmendmentInfo.ChangeDates = false;
                bookingResponse.AmendmentInfo.CanBookingCancelled = false;
                bookingResponse.AmendmentInfo.AmendBookingStatus.Add(AmendBookingStatus.NotLoggedAsTradeAgent);
            }

            // Only lead passengers can amend B2C bookings
            if (!bookingResponse.IsExternalAgency && !loggedAsBookingLeadPassenger)
            {
                bookingResponse.AmendmentInfo.Route = false;
                bookingResponse.AmendmentInfo.Transfer.AmendAllow = false;
                bookingResponse.AmendmentInfo.Transfer.DowngradeAllow = false;
                bookingResponse.AmendmentInfo.Pax.AmendAllow = false;
                bookingResponse.AmendmentInfo.Pax.AmendNameOnly = false;
                bookingResponse.AmendmentInfo.Seats = false;
                bookingResponse.AmendmentInfo.ChangeDates = false;
                bookingResponse.AmendmentInfo.CanBookingCancelled = false;
                bookingResponse.AmendmentInfo.AmendBookingStatus.Add(AmendBookingStatus.NotLoggedAsBookingLeadPassenger);
            }
        }
    }
}