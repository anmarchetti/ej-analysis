using Newtonsoft.Json.Linq;

namespace easyJet.Holidays.Api.Domain.Interfaces.Payment
{
    /// <summary>
    /// ApplePay Merchant Validation Proxy service.
    /// NO orchestration is happening here, just communication to ApplePay Proxy 
    /// </summary>
    public interface IApplePayMerchantValidatorProxyService
    {
        /// <summary>Recover ApplePay Session from ApplePay Merchant Validator Proxy throw to EI layer</summary>
        /// <param name="validationUrl">Validation Url</param>
        /// <param name="requestDomain">Request Domain</param>
        /// <returns>ApplePay object session with JObject format</returns>
        Task<JObject> GetSessionObject(Uri validationUrl, string requestDomain);
    }
}
