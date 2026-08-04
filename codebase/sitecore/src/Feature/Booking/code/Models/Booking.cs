namespace easyJet.Feature.Booking.Models
{
    /// <summary>
    /// Base cancellation and refund model, another cancellation and refund models should inherit from this model. Should has only 1 level of inheritance.
    /// </summary>
    public class Booking
    {
        public virtual string Reference { get; set; }

        public string Flag { get; set; }
    }
}