namespace easyJet.Feature.Booking.Models
{
    /// <summary>
    /// Add credit to booking model.
    /// </summary>
    public class SpendCredit : Booking
    {
        public string Email { get; set; }

        public string Amount { get; set; }
    }
}