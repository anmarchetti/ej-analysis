using easyJet.Foundation.SitecoreExtensions.Attributes;

namespace easyJet.Feature.Booking.Models
{
    /// <summary>
    /// Booking credit model. Should inherit from Booking model.
    /// </summary>
    public class CreditBooking : Booking
    {
        [IgnoreCsvColumn]
        public string Email { get; set; }

        public string Reason { get; set; }

        public string Source { get; set; }

        public string Memo { get; set; }

        public string Amount { get; set; }
    }
}