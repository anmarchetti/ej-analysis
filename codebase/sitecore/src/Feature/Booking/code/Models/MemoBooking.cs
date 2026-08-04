namespace easyJet.Feature.Booking.Models
{
    /// <summary>
    /// Modify booking memo model. Should inherit from Booking model.
    /// </summary>
    public class MemoBooking : Booking
    {
        public string MemoCode { get; set; }

        public string MemoDescription { get; set; }
    }
}