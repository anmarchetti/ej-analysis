using easyJet.Holidays.Api.Domain.Data.Booking;
using System.ComponentModel.DataAnnotations;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.AmendBooking
{
    [Serializable]
    [DataContract]
    public class AmendBookingTransfersRequest
    {
        /// <summary>
        /// Booking reference
        /// </summary>
        [DataMember(Name = "bookingReference")]
        [Required]
        public string BookingReference { get; set; }

        /// <summary>
        /// Transfers data
        /// </summary>
        [DataMember(Name = "transfers")]
        [Required]
        public IEnumerable<TransferItem> Transfers { get; set; }
    }
}