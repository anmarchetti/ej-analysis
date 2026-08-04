namespace easyJet.Feature.Booking.Models
{
    /// <summary>
    /// Cancel and credit booking model. Should inherit from Booking model.
    /// </summary>
    public class CancelAndCreditBooking : Booking
    {
        public string Memo { get; set; }
    }
}