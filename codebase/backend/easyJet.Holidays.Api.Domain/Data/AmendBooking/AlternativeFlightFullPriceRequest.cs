using System.ComponentModel.DataAnnotations;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.AmendBooking
{
    public class AlternativeFlightFullPriceRequest
    {
        /// <summary>
        /// Booking reference
        /// </summary>
        [DataMember(Name = "bookingReference")]
        [Required]
        public string BookingReference { get; set; }

        /// <summary>
        /// Information about alternative package mainly obtained form avcache
        /// </summary>
        [DataMember(Name = "AlternativePackage")]
        [Required]
        public List<AlternativePackage> AlternativePackages { get; set; }
    }
}
