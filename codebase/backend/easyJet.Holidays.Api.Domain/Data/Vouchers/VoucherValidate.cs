using System.Runtime.Serialization;
using Voucherify.Core.DataModel;

namespace easyJet.Holidays.Api.Domain.Data.Vouchers
{
    /// <summary>
    /// Validate voucher model
    /// </summary>
    [Serializable]
    [DataContract]
    public class ValidateVoucher : IVoucherifyObject
    {
        /// <summary>
        /// Voucher code
        /// </summary>
        [DataMember]
        public string VoucherCode { get; set; }

        /// <summary>
        /// Atcom discount code
        /// </summary>
        [IgnoreDataMember]
        public string AtcomDiscountCode { get; set; }

        /// <summary>
        /// Discount value
        /// </summary>
        [DataMember]
        public decimal? Amount { get; set; }

        /// <summary>
        /// Currency
        /// </summary>
        [DataMember]
        public string Currency { get; set; }

        /// <summary>
        /// Is voucher active
        /// </summary>
        [DataMember]
        public bool? Active { get; set; }

        /// <summary>
        /// Voucher expiration date
        /// </summary>
        [DataMember]
        public DateTime? ExpirationDate { get; set; }

        /// <summary>
        /// Marketing campaign name
        /// </summary>
        [DataMember]
        public string Campaign { get; set; }

        /// <summary>
        /// Voucher type
        /// </summary>
        [DataMember]
        public VoucherType VoucherType { get; set; }

        /// <summary>
        /// User current balance
        /// </summary>
        [DataMember]
        public decimal? UserCurrentBalance { get; set; }

        /// <summary>
        /// User balance after applying gift voucher
        /// </summary>
        [DataMember]
        public decimal? UserNewBalance { get; set; }

        /// <summary>
        /// Metadata
        /// </summary>
        [IgnoreDataMember]
        public Metadata Metadata { get; set; }
    }

}