using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.External.Domain.Models.Api;
using Newtonsoft.Json.Linq;

namespace easyJet.Holidays.External.ApplePay.Models
{
    /// <summary>
    /// ApplePay - Get ApplePay Session Object
    /// </summary>
    public class ApplePayGetSessionResponse : JsonApiResponse<JObject>
    {
        /// <summary>
        /// ApiErrors
        /// </summary>
        public override ApiError[] ApiErrors => []; // Don't handle response body errors
    }
}