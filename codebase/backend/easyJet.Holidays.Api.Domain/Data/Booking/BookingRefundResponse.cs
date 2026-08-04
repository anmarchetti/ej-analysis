using easyJet.Holidays.Api.Common.Exceptions;

namespace easyJet.Holidays.Api.Domain.Data.Booking
{
    public class BookingRefundResponse
    {
        public ApiException Exception { get; set; }

        public PaymentHistoryItem Payment { get; set; }

        /// <summary>
        /// Refund payment id. Shold be used to cancel payment
        /// </summary>
        public string PaymentId { get; set; }
    }
}
