using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Vouchers.Expiring
{
    /// <summary>
    /// Customer expiring vouchers model
    /// </summary>
    [DataContract]
    public class ExpiringVouchersGroup
    {
        /// <summary>
        /// Customer details
        /// </summary>
        [DataMember]
        public VoucherCustomer Customer { get; set; }

        /// <summary>
        /// Collection of customer vouchers
        /// </summary>
        [DataMember]
        public IEnumerable<ExpiringVoucher> Vouchers { get; set; }
    }
}