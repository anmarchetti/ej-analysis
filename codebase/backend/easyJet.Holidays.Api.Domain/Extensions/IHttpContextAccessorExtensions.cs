using Microsoft.AspNetCore.Http;

namespace easyJet.Holidays.Api.Domain.Extensions
{
    /// <summary>
    /// HttpContext extension methods
    /// </summary>
    public static class IHttpContextAccessorExtensions
    {
        /// <summary>
        /// Get request cookines or null if it's not available
        /// </summary>
        /// <param name="httpContextAccessor">Http context</param>
        /// <returns>Whether request is local or not</returns>
        public static IRequestCookieCollection RequestCookies(this IHttpContextAccessor httpContextAccessor)
        {
            return httpContextAccessor?.HttpContext?.Request?.Cookies;
        }
    }
}
