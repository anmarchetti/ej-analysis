using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Vouchers;

namespace easyJet.Holidays.Api.Domain.Interfaces.Booking
{
    /// <summary>
    /// Booking service
    /// </summary>
    public interface IBookingCreditService
    {
        /// <summary>
        /// Then a credit voucher is created for the full amount the user has paid on the booking 
        /// and the booking is marked as cancelled
        /// And a memo is added to the booking “Voucher created”
        /// And a negative payment is added to reverse all money paid on the booking onto a payment type of “credit-issued”
        /// And the payment reference will be the ID of the voucher being created
        /// Note: Multiple payments on a booking result in a single payment.
        /// </summary>        
        /// <param name="bookingRequest">Booking request model</param>
        /// <param name="customerId">Customer Id</param>
        /// <param name="customerDetails">Customer details for case when need to create new customer</param>
        /// <returns></returns>
        Task<Data.Vouchers.BookingRefundResponse> RefundBooking(ConvertBookingToCreditRequest bookingRequest, string customerId = null, Domain.Data.Authentication.CustomerDetails customerDetails = null);

        /// <summary>
        /// Spend credits
        /// </summary>
        /// <param name="booking">Booking model</param>
        /// <param name="amount">Amount to spend</param>
        /// <param name="currency">Currency of credits</param>
        /// <param name="customerId">Voucherify customer id</param>
        /// <param name="redemptionMetadata">Redemption metadata: action, source, etc. (optional)</param>
        /// <returns></returns>
        Task<List<CreditSpend>> SpendCredit(BookingResponse booking, decimal amount, string currency, string customerId,
            RedemptionMetadata redemptionMetadata = null);

        /// <summary>
        /// Partial refund (e.g. downgrade booking)
        /// </summary>
        /// <param name="bookingResponse">Booking response model</param>
        /// <param name="convertType">Convert type</param>
        /// <param name="refundAmount">Amount of refund</param>
        /// <returns></returns>
        Task<Data.Vouchers.BookingRefundResponse> PartialRefund(BookingResponse bookingResponse,
            ConvertType convertType, decimal refundAmount);
    }
}