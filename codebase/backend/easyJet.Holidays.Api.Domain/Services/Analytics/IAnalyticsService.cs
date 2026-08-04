using easyJet.Holidays.Api.Domain.Data.Analytics;
using Microsoft.AspNetCore.Http;

namespace easyJet.Holidays.Api.Domain.Services.Analytics
{
    /// <summary>
    /// Analytics service
    /// </summary>
    public interface IAnalyticsService
    {
        /// <summary>
        /// Adds analytics cookies: session id and user id if it's allowed by environment behavior settings
        /// </summary>
        /// <param name="httpContext">Http context</param>
        void AddAnalyticsData(HttpContext httpContext);

        /// <summary>
        /// Get request analytics cookies values
        /// </summary>
        /// <param name="httpContext">Http context</param>
        /// <returns>Cookies values</returns>
        RequestAnalytics GetAnalyticsData(HttpContext httpContext);
    }
}
