using easyJet.Holidays.Api.Domain.Data.Booking;
using System.Collections.ObjectModel;

namespace easyJet.Holidays.Api.Domain.Interfaces.Booking
{
    /// <summary>
    /// Booking service
    /// </summary>
    public interface IBookingRefundService
    {
        /// <summary>
        /// Refund cancelled bookng payments (add the same amount with "-") in both Booking and Payment systems (customer will get money back)
        /// </summary>
        /// <param name="booking"></param>
        /// <returns>Whether migration was without errors or not</returns>
        Task<List<BookingRefundResponse>> RefundNonCreditPayments(BookingResponse booking);

        /// <summary>
        /// Refund specified amount of money
        /// </summary>
        /// <param name="booking"></param>
        /// <param name="amountToRefund"></param>
        /// <returns></returns>
        Task<List<BookingRefundResponse>> Refund(BookingResponse booking, decimal amountToRefund);

        /// <summary>
        /// Get payment items available for refund action
        /// </summary>
        /// <param name="booking">Bookingobject</param>
        /// <returns>Collection of payment items</returns>
        List<PaymentHistoryItem> PaymentsAvailableForRefund(BookingResponse booking);

        /// <summary>
        /// Rollback all refunds 
        /// </summary>
        /// <param name="bookingResponse"></param>
        /// <param name="refunds"></param>
        /// <param name="exception"></param>
        /// <returns></returns>
        Task<bool> RollbackRefund(BookingResponse bookingResponse, ReadOnlyCollection<BookingRefundResponse> refunds, Exception exception = null);

        /// <summary>
        /// Add cash memo to the booking
        /// </summary>
        /// <param name="cashRefundAmount"></param>
        /// <param name="booking"></param>
        /// <returns></returns>
        Task AddCashMemoToBooking(decimal cashRefundAmount, BookingResponse booking);
        
                
        /// <summary>
        /// Gets the refund cash amount from the memo description
        /// </summary>
        /// <param name="bookingResponse"></param>
        /// <returns></returns>
        decimal? GetRefundAmountFromCashRefundMemo(BookingResponse bookingResponse);
    }
}