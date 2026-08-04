using System.Collections.ObjectModel;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Vouchers
{
    /// <summary>
    /// Response for the booking refund
    /// </summary>
    [Serializable]
    [DataContract]
    public class BookingRefundResponse
    {
        [DataMember]
        public MyCreditInfo Credit { get; set; }

        [DataMember]
        public decimal Credits { get; set; }

        [DataMember]
        public decimal Cash { get; set; }
    }
    
    /// <summary>
    /// Extended with list of vouchers response for the booking refund
    /// </summary>
    [Serializable]
    [DataContract]
    public class BookingRefundExtendedResponse: BookingRefundResponse
    {
        /// <summary>
        /// List of all created vouchers
        /// </summary>
        [DataMember]
        public ReadOnlyCollection<CreatedVoucher> CreatedVouchers { get; init; } = new(new List<CreatedVoucher>());
    }
}
