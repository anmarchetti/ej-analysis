using System.ComponentModel.DataAnnotations;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Payment
{
    /// <summary>
    /// ApplePay Session Request with required information to retrieve the object
    /// </summary>
    [Serializable]
    [DataContract]
    public class ApplePaySessionRequest
    {
        /// <summary>
        /// ApplePay Server Validation Url
        /// </summary>
        [DataMember(Name = "validationUrl")]
        [Required]
        public Uri ValidationUrl { get; set; }

        /// <summary>
        /// ApplePay Session Request Domain
        /// </summary>
        [DataMember(Name = "requestDomain")]
        public string RequestDomain { get; set; }
    }
}
