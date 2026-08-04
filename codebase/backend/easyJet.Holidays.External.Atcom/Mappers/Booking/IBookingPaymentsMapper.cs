using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Data.Payment;
using easyJet.Holidays.Api.Domain.Settings;

namespace easyJet.Holidays.External.Atcom.Mappers.Booking
{
    public interface IBookingPaymentsMapper
    {
        /// map between 
        ///     easyJet.Holidays.External.Atcom.Models.Booking 
        /// and 
        ///     easyJet.Holidays.Api.Domain.Data.Booking
        ///   
        Models.Booking.BookingWithPaymentRequest MapModifyCustPaymentRequest(
            PaymentInfo paymentInfo,
            LeadPassenger leadPassenger,
            MakePaymentResponse paymentResponse,
            Models.Booking.BookingRequest atcomRequest,
            string bookingId,
            string authSys,
            bool offline = false);

        Models.Booking.BookingWithPaymentRequest MapCreditModifyCustPaymentRequest(
           decimal amount,
           string bookingId,
           PaymentTypeSettings type,
           Models.Booking.BookingRequest bookingAtcomRequest,
           string voucherId = null);

        /// <summary>
        /// Map ModifyCustPaymentRequest.
        /// Also supports refund if <see cref="refundAgainstId"/> is not empty. In this case Amount will be: minus <see cref="paymentItem.Amount"/>.
        /// </summary>
        /// <param name="bookingId">Target booking it</param>
        /// <param name="paymentItem">Payment item</param>
        /// <param name="refundAgainstId">Payment id for refund (optional)</param>
        /// <param name="bookingAtcomRequest">Booking atcom request to build target request</param>
        /// <returns></returns>
        Models.Booking.BookingWithPaymentRequest MapModifyCustPaymentRequest(
            string bookingId,
            PaymentHistoryItem paymentItem,
            string refundAgainstId,
            string paymentId,
            Models.Booking.BookingRequest bookingAtcomRequest);
    }
}
