using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Vouchers.Expiring
{
    /// <summary>
    /// Voucher details model
    /// </summary>
    [DataContract]
    public class ExpiringVoucher
    {
        /// <summary>
        /// Code
        /// </summary>
        [DataMember]
        public string Code { get; set; }

        /// <summary>
        /// Campaign name
        /// </summary>
        [DataMember]
        public string Campaign { get; set; }

        /// <summary>
        /// Category
        /// </summary>
        [DataMember]
        public string Category { get; set; }

        /// <summary>
        /// Type(GiftVoucher or DiscountVoucher)
        /// </summary>
        [DataMember]
        public string Type { get; set; }

        /// <summary>
        /// Remaining balance
        /// </summary>
        [DataMember]
        public decimal Balance { get; set; }

        /// <summary>
        /// Expiration date
        /// </summary>
        [DataMember]
        public DateTime? ExpirationDate { get; set; }

        /// <summary>
        /// Additional metadata
        /// </summary>
        [DataMember]
        public Dictionary<string, string> Metadata { get; set; }
    }
}
