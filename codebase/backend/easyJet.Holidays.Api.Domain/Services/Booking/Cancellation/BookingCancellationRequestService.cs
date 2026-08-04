using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Services.Authentication;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.Api.Domain.Services.Booking.Cancellation
{
    /// inheritdoc
    public class BookingCancellationRequestService(
        IHttpContextAccessor httpContextAccessor,
        IAuthenticationService authenticationService,
        IOptions<CookiesSettings> cookiesSettings)
        : IBookingCancellationRequestService
    {
        private readonly CookiesSettings _cookiesSettings = cookiesSettings?.Value ?? throw new ArgumentNullException(nameof(cookiesSettings));

        /// inheritdoc
        public async Task<bool> IsWebsiteRequest()
        {
            if (IsLanguageCookieInRequest())
                return true;

            var customerEmail = await authenticationService.GetCustomerEmail();
            return !string.IsNullOrEmpty(customerEmail);
        }

        private bool IsLanguageCookieInRequest()
        {
            if (string.IsNullOrEmpty(_cookiesSettings.Language))
                return false;

            if (httpContextAccessor.HttpContext?.Request?.Cookies == null)
                return false;

            return httpContextAccessor.HttpContext.Request.Cookies.ContainsKey(_cookiesSettings.Language);
        }
    }
}
