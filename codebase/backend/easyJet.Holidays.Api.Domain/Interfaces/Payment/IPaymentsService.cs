using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Payment;
using easyJet.Holidays.Api.Domain.Data.Settings;

namespace easyJet.Holidays.Api.Domain.Interfaces.Payment
{
    /// <summary>
    /// Payment Gateway service. NO orchestration is happening here, just communication to Payment Gateway
    /// </summary>
    public interface IPaymentsService
    {
        /// <summary>Execute makePayment request to EI layer</summary>
        /// 
        /// <param name="accom">Accommodation model</param>
        /// <param name="paymentInfo">Accom payment info</param>
        /// <param name="bookingRequest">Booking request</param>
        /// <param name="bookingReference">booking reference (from validate response)</param>
        /// <param name="sessionId">Booking session ID</param>
        /// <param name="market">Booking market settings</param>
        /// <returns></returns>
        // Task<MakePaymentResponse> MakePayment(ValidateBookingResponse validateResponse, BookingRequest bookingRequest, string bookingReference, string sessionId);
        Task<MakePaymentResponse> MakePayment(BookingAccommodation accom, PriceInfo paymentInfo, BookingRequest bookingRequest, string bookingReference, string sessionId, MarketSettings market);

        /// <summary>Cancel payment via EI layer</summary>
        /// <returns></returns>
        /// <param name="bookingReference">booking reference (from validate response)</param>
        /// <param name="paymentId">payment ID to cancel</param>
        /// <param name="customerEmail">customer email</param>
        Task<CancelPaymentResponse> CancelPayment(string bookingReference, string paymentId, string customerEmail);

        /// <summary>Refund payment via EI layer</summary>
        /// <returns></returns>
        Task<RefundPaymentResponse> RefundPayment(string bookingReference, string paymentId, decimal amount, string currency, string customerEmail);
    }
}
