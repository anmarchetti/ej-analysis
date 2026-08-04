using System.ComponentModel.DataAnnotations;

namespace easyJet.Holidays.Api.Domain.Data.HelpCenter
{
    /// <summary>
    /// Model represents feedback info request
    /// </summary>
    public class FeedbackInfoRequest
    {
        /// <summary>
        /// Question for user
        /// </summary>
        [Required]
        public string Question { get; set; }

        /// <summary>
        /// Icon number choosed by user
        /// </summary>
        [Required]
        public int Icon { get; set; }

        /// <summary>
        /// User comment
        /// </summary>
        public string Comment { get; set; }

        /// <summary>
        /// Language code
        /// </summary>
        public string LanguageCode { get; set; }

        /// <summary>
        /// Market code
        /// </summary>
        public string MarketCode { get; set; }

        /// <summary>
        /// Local time
        /// </summary>
        public DateTime LocalTime { get; set; }

        /// <summary>
        /// Booking Type
        /// </summary>
        public string BookingType { get; set; }
    }
}
