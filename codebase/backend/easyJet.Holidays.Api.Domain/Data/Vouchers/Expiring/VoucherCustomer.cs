using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Vouchers.Expiring
{
    /// <summary>
    /// Customer details model
    /// </summary>
    [DataContract]
    public class VoucherCustomer
    {
        /// <summary>
        /// Name
        /// </summary>
        [DataMember]
        public string Name { get; set; }

        /// <summary>
        /// Email
        /// </summary>
        [DataMember]
        public string Email { get; set; }
    }
}