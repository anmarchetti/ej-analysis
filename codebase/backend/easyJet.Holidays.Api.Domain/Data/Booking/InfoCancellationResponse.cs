using System.ComponentModel.DataAnnotations;
using System.Runtime.Serialization;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.Payment;

namespace easyJet.Holidays.Api.Domain.Data.Booking
{
    /// <summary>
    /// 
    /// </summary>
    public class InfoCancellationResponse
    {
        /// <summary>
        /// Booking status: e.g. CONFIRMED
        /// </summary>
        [DataMember(Name = "bookingStatus")]
        public string BookingStatus { get; set; }

        /// <summary>
        /// Booking reference
        /// </summary>
        [DataMember(Name = "bookingReference")]
        public string BookingReference { get; set; }

        /// <summary>
        /// Booking date
        /// </summary>
        [DataMember(Name = "bookingDate")]
        public DateTime? BookingDate { get; set; }

        /// <summary>
        /// cancellationDate date
        /// </summary>
        [DataMember(Name = "hasNotice")]
        public bool HasNotice { get; set; }

        /// <summary>
        /// 
        /// </summary>
        [DataMember(Name = "cancellationDate")]
        public DateTime? CancellationDate { get; set; }

        /// <summary>
        /// Fee Item which holds the cancellation fee amount
        /// </summary>
        public FeeItem CancellationFeeItem { get; set; }

        /// <summary>
        /// All other fee items except the cancellation fee
        /// </summary>
        public IReadOnlyCollection<FeeItem> FeeItems { get; set; }
    }
}