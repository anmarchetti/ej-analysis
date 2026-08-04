namespace easyJet.Holidays.Api.Domain.Data.Booking
{
    public class CancelBookingRequest
    {

        /// <summary>
        /// Booking ref id
        /// </summary>
        public string BookingReference { get; set; }

        /// <summary>
        /// Cancelation reason
        /// </summary>
        public string Reason { get; set; }
    }
}
