using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Data.Payment;

namespace easyJet.Holidays.Api.Domain.Interfaces.Booking.Repository
{
    /// <summary>
    /// Booking payments repository
    /// </summary>
    public interface IBookingPaymentsRepository
    {
        /// <summary>
        /// Add payment information to existing booking.
        /// </summary>
        /// <param name="paymentInfo">Payment inforamtion</param>
        /// <param name="leadPassenger">Lead passenger info</param>
        /// <param name="paymentResponse">Payment service response</param>
        /// <param name="bookingReference">Booking reference</param>
        /// <param name="bookingMarket">Booking market</param>
        /// <param name="bookingLanguage">Booking language</param>
        /// <param name="sessionId">Session ID</param>
        /// <param name="requestId">Request ID</param>
        /// <param name="promotionCollections"></param>
        /// <returns></returns>
        Task<BookingResponse> AddCreditPaymentInfo(
                    PaymentInfo paymentInfo,
                    LeadPassenger leadPassenger,
                    MakePaymentResponse paymentResponse,
                    string bookingReference,
                    string bookingMarket,
                    string bookingLanguage,
                    string sessionId,
                    string requestId,
                    IList<string> promotionCollections = null);

        /// <summary>
        /// Add payment info.
        /// If <see cref="refundAgainstId"/> is not empty amount will be refunded.
        /// </summary>
        /// <param name="bookingReference">Booking reference</param>
        /// <param name="bookingMarket">Booking market</param>
        /// <param name="bookingLanguage">Booking language</param>
        /// <param name="paymentItem"></param>
        /// <param name="refundAgainstId"></param>
        /// <param name="leadPassenger">Lead guest details</param>
        /// <param name="sessionId">Booking session id</param>
        /// <param name="paymentId">Payment id</param>
        /// <param name="requestId">Booking request id</param>
        /// <param name="promotionCollections"></param>
        /// <returns></returns>
        Task<BookingResponse> AddCreditPaymentInfo(
                  string bookingReference,
                  string bookingMarket,
                  string bookingLanguage,
                  PaymentHistoryItem paymentItem,
                  string refundAgainstId,
                  string paymentId,
                  LeadPassenger leadPassenger,
                  string sessionId,
                  string requestId,
                  IList<string> promotionCollections = null);

        /// <summary>
        /// Add credit issues payment information to booking (refund)
        /// </summary>
        /// <param name="reasonCode">Credit reason code</param>
        /// <param name="amount">Amount of credit issues(negative)</param>
        /// <param name="leadPassenger">Lead guest details</param>
        /// <param name="bookingReference">Booking reference</param>
        /// <param name="bookingMarket">Booking market</param>
        /// <param name="bookingLanguage">Booking language</param>
        /// <param name="voucherId">Voucher id</param>
        /// <param name="sessionId">Booking session id</param>
        /// <param name="requestId">Booking request id</param>
        /// <param name="promotionCollections"></param>
        /// <returns>response from Atcom</returns>
        Task<BookingResponse> AddCreditPaymentInfo(
            string reasonCode,
            //PaymentType type,
            decimal amount,
            LeadPassenger leadPassenger,
            string bookingReference,
            string bookingMarket,
            string bookingLanguage,
            string voucherId,
            string sessionId = null,
            string requestId = null,
            IList<string> promotionCollections = null);
    }
}
