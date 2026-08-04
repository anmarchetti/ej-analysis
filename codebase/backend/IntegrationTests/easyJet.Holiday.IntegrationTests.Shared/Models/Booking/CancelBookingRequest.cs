namespace easyJet.Holiday.IntegrationTests.Shared.Models.Booking
{
    public class CancelBookingRequest
    {
        public string BookingReference { get; set; }
        public string Reason { get; set; }
    }
}
