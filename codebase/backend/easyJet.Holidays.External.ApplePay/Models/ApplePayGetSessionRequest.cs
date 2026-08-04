using easyJet.Holidays.External.Domain.Models.Api;
using System.Runtime.Serialization;

namespace easyJet.Holidays.External.ApplePay.Models
{
    /// <summary>
    /// ApplePayGetSession Request
    /// </summary>
    public class ApplePayGetSessionRequest : JsonApiRequest<ApplePayGetSessionRequestBody>
    {
        /// <summary>
        /// Method
        /// </summary>
        public override HttpMethod Method => HttpMethod.Post;
    }

    /// <summary>
    /// ApplePayGetSessionRequest Body
    /// </summary>
    [DataContract]
    public class ApplePayGetSessionRequestBody
    {
        /// <summary>
        /// Display Name.
        /// </summary>
        [DataMember(Name = "displayName", EmitDefaultValue = false)]
        public string DisplayName { get; set; }

        /// <summary>
        /// Request Domain.
        /// </summary>
        [DataMember(Name = "requestDomain", EmitDefaultValue = false)]
        public string RequestDomain { get; set; }

        /// <summary>
        /// Validation Url
        /// </summary>
        [DataMember(Name = "validationUrl", EmitDefaultValue = false)]
        public Uri ValidationUrl { get; set; }

        /// <summary>
        /// Origin.
        /// </summary>
        /// <value>EasyjetHolidays.</value>
        [DataMember(Name = "origin", EmitDefaultValue = false)]
        public string Origin { get; set; } = "EasyjetHolidays";
    }
}
