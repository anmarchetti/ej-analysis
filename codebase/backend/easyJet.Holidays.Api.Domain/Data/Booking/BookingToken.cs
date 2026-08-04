using System.ComponentModel.DataAnnotations;

namespace easyJet.Holidays.Api.Domain.Data.Booking
{
    /// <summary>
    /// Booking token model
    /// </summary>
    public class BookingToken
    {
        /// <summary>
        /// Booking reference
        /// </summary>
        [Display(Order = 1)]
        public string BookingReference { get; set; }

        /// <summary>
        /// Booking guest last name
        /// </summary>
        [Display(Order = 2)]
        public string LastName { get; set; }

        /// <summary>
        /// Booking departure date
        /// </summary>
        [Display(Order = 3)]
        public DateTime Date { get; set; }
    }
}
