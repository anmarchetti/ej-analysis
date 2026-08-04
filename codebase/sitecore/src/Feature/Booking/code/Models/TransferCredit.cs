namespace easyJet.Feature.Booking.Models
{
    /// <summary>
    /// Transfer credit between accounts.
    /// </summary>
    public class TransferCredit : Booking
    {
        /// <summary>
        /// Gets or sets email to transfer credits.
        /// </summary>
        public string Email { get; set; }

        public string Amount { get; set; }
    }
}