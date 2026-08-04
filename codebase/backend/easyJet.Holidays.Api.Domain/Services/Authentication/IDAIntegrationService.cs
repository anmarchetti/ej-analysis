using easyJet.Holidays.Api.Domain.Data.Authentication;
using Microsoft.AspNetCore.Http;

namespace easyJet.Holidays.Api.Domain.Services
{
    /// <summary>
    /// DA integration service
    /// </summary>
    public interface IDAIntegrationService
    {
        /// <summary>
        /// Set DA integration cookies
        /// </summary>
        /// <param name="context">Http context</param>
        /// <param name="authData">Authentication data</param>
        void SetCookie(HttpContext context, CustomerAuthModel authData);

        /// <summary>
        /// Deletes DA integratio cookies
        /// </summary>
        /// <param name="context">Htt context</param>
        void RemoveCookie(HttpContext context);

        /// <summary>
        /// Get authentication model from DA cookies
        /// </summary>
        /// <param name="context">Http context</param>
        /// <returns>Auth model</returns>
        CustomerAuthModel GetCookie(HttpContext context);

        T Deserialize<T>(string value) where T : class;

        string Serialize<T>(T value) where T : class;
    }
}
