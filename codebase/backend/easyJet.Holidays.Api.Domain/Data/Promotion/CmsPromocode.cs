using easyJet.Holidays.Api.Domain.Data.Errors;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Promotion
{
    /// <summary>
    /// Validate Promotion.
    /// </summary>
    [Serializable]
    [DataContract]
    public class CmsPromocode
    {
        /// <summary>
        /// Voucher code.
        /// </summary>
        [DataMember]
        public string Promocode { get; set; }

        /// <summary>
        /// Collection of Validatation Results.
        /// </summary>
        [DataMember]
        public ApiError[] ValidationResults { get; set; }
    }
}
