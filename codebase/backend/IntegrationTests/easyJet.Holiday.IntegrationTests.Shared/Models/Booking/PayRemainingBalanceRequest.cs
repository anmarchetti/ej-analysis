using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Payment;

namespace easyJet.Holiday.IntegrationTests.Shared.Models.Booking
{
    public class PayRemainingBalanceRequest
    {
        public PaymentInfo PaymentInfo { get; set; }
        public BrowserInfo BrowserInfo { get; set; }
        public string BookingReference { get; set; }
        public string LastName { get; set; }
        public string Date { get; set; }
        public string DeviceId { get; set; }
    }
}
