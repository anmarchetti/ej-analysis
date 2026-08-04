using easyJet.Holidays.Api.Domain.Data.Vouchers;
using System.Collections.ObjectModel;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Booking.Cancellation
{
    /// <summary>
    /// Response for the cancellation of a booking
    /// </summary>
    public class CancellationResponse
    {
        /// <summary>
        /// Booking reference
        /// </summary>
        [DataMember(Name = "bookingReference")]
        public string BookingReference { get; set; }

        /// <summary>
        /// The cash refund amount
        /// </summary>
        public decimal CashRefundAmount { get; init; }

        /// <summary>
        /// The credit refund amount
        /// </summary>
        public decimal CreditRefundAmount { get; init; }
    }
    
    /// <summary>
    /// Extended response for the cancellation of a booking
    /// </summary>
    public class CancellationExtendedResponse: CancellationResponse
    {
        /// <summary>
        /// List of all refunds
        /// </summary>
        public ReadOnlyCollection<BookingRefundResponse> BookingRefundList { get; init; }
 
        /// <summary>
        /// List of all created vouchers
        /// </summary>
        public ReadOnlyCollection<CreatedVoucher> CreatedVoucherList { get; init; }
    }
    
}
