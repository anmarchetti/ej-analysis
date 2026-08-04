using Microsoft.AspNetCore.Http;

namespace easyJet.Holidays.Api.Domain.Services.Cookies
{
    /// <summary>
    /// Cookies provider
    /// </summary>
    public interface ICookiesService
    {
        /// <summary>
        /// Returns  the mock Uri from ejSitecoreMock cookie
        /// </summary>
        /// <param name="cookies">Collection of cookie</param>
        /// <returns>Sitecore mock Uri</returns>
        string SitecoreMockCookie(IRequestCookieCollection cookies);

        /// <summary>
        /// Returns  the mock Uri from ejAtcomMock cookie
        /// </summary>
        /// <param name="cookies">Collection of cookie</param>
        /// <returns>Atcom mock Uri</returns>
        string AtcomMockCookie(IRequestCookieCollection cookies);

        /// <summary>
        /// Returns the mock Uri from ejB2BMock cookie
        /// </summary>
        /// <param name="cookies">Collection of cookie</param>
        /// <returns>B2B mock Uri</returns>
        string B2BMockCookie(IRequestCookieCollection cookies);

        /// <summary>
        /// Returns the mock Uri from ejPaymentMock cookie
        /// </summary>
        /// <param name="cookies">Collection of cookie</param>
        /// <returns>Payment mock Uri</returns>
        string PaymentMockCookie(IRequestCookieCollection cookies);

        /// <summary>
        /// Returns the mock Uri from ejDfloMock cookie
        /// </summary>
        /// <param name="cookies">Collection of cookie</param>
        /// <returns>dFlo mock Uri</returns>
        string DfloMockCookie(IRequestCookieCollection cookies);

        /// <summary>
        /// Returns the mock Uri from ejSmartSeerMock cookie
        /// </summary>
        /// <param name="cookies">Collection of cookie</param>
        /// <returns>SmartSeer mock Uri</returns>
        string SmartSeerMockCookie(IRequestCookieCollection cookies);

        /// <summary>
        /// Returns the mock Uri from tripAdvisor cookie
        /// </summary>
        /// <param name="cookies">Collection of cookie</param>
        /// <returns>Payment mock Uri</returns>
        string TripAdvisorMockCookie(IRequestCookieCollection cookies);

        /// <summary>
        /// Returns the mock Uri from ejVoucherifyMock cookie
        /// </summary>
        /// <param name="cookies">Collection of cookie</param>
        /// <returns>SmartSeer mock Uri</returns>
        string VoucherifyMockCookie(IRequestCookieCollection cookies);
        
        /// <summary>
        /// Returns the mock Uri from transferManagementMock cookie
        /// </summary>
        /// <param name="cookies">Collection of cookie</param>
        /// <returns>TransferManagement mock Uri</returns>
        string TransferManagementMockCookie(IRequestCookieCollection cookies);

        /// <summary>
        /// Returns the mock Uri from ejGoogleMock cookie
        /// </summary>
        /// <param name="cookies">Collection of cookie</param>
        /// <returns>SmartSeer mock Uri</returns>
        string GoogleMockCookie(IRequestCookieCollection cookies);
        
        /// <summary>
        /// Returns the mock Uri from bid sitecorePersonalize cookie
        /// </summary>
        /// <param name="cookies">Collection of cookie</param>
        /// <returns>Sitecore Personalize mock Uri</returns>
        string SitecorePersonalizeCookie(IRequestCookieCollection cookies);

        /// <summary>
        /// Returns the mock Uri from ejMusementMock cookie
        /// </summary>
        /// <param name="cookies">Collection of cookie</param>
        /// <returns>Musement mock Uri</returns>
        string MusementMockCookie(IRequestCookieCollection cookies);
        
        /// <summary>
        /// Returns the mock Uri from ejMusementMock cookie
        /// </summary>
        /// <param name="cookies">Collection of cookie</param>
        /// <returns>Musement mock Uri</returns>
        string ApolloMockCookie(IRequestCookieCollection cookies);

        /// <summary>
        /// Get cookie value
        /// </summary>
        /// <param name="cookieCollection">Collection of cookies</param>
        /// <param name="cookieName">Cookie name</param>
        /// <returns>Cookie value</returns>
        string GetCookie(IRequestCookieCollection cookieCollection, string cookieName);

        /// <summary>
        /// Create cookie and add to response. Doesn't encode cookie value. <br/>
        /// ATTENTION: Ensure that you only use this method with <paramref name="httpOnly"/> = false, 
        /// if the cookie doesn't contain sensitive data, e.g. session cookie.
        /// </summary>
        /// <param name="context">Http context</param>
        /// <param name="name">Cookie name</param>
        /// <param name="value">Cookie value</param>
        /// <param name="domain">Cookie domain</param>
        /// <param name="expires">Expiration date</param>
        /// <param name="httpOnly">Http only or not. See hint on method itself.</param>
        void CreateCookie(HttpContext context, string name, string value, string domain, DateTime? expires, bool httpOnly);

        /// <summary>
        /// Delete cookie by name. <br/>
        /// Make sure you pass the same value for <paramref name="httpOnly"/> as was used when creating the cookie with <see cref="CreateCookie"/>.
        /// </summary>
        /// <param name="context">Http context</param>
        /// <param name="cookieName">Cookie name</param>
        /// <param name="domain">Cookie domain</param>
        /// <param name="httpOnly">If cookie is http only or not, should match value provided during creation.</param>
        void DeleteCookie(HttpContext context, string cookieName, string domain, bool httpOnly);
    }
}
