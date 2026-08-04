using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Booking.Cancellation;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Data.Vouchers;
using BookingRefundResponse = easyJet.Holidays.Api.Domain.Data.Vouchers.BookingRefundResponse;
using CustomerDetails = easyJet.Holidays.Api.Domain.Data.Authentication.CustomerDetails;

namespace easyJet.Holidays.Api.Domain.Services.Vouchers
{
    /// <summary>
    /// Vouchers service: create, spend, history methods.
    /// </summary>
    public interface IVouchersService
    {
        /// <summary>
        /// Checks whether reason code is valid
        /// </summary>
        /// <param name="reasonCode">Reason code value</param>
        /// <returns></returns>
        bool IsReasonCodeValid(string reasonCode);

        /// <summary>
        /// Exchange Voucherify discount code to Atcom Promo code
        /// </summary>
        /// <param name="voucherCode">voucherify discount code</param>
        /// <returns>atcom promo code</returns>
        Task<string> ExchangeDiscountToAtcomCode(string voucherCode);

        /// <summary>
        /// Map Voucherify discount code to Atcom Promo code
        /// </summary>
        /// <param name="voucherCode"></param>
        /// <returns></returns>
        Task<string> MapDiscountToAtcomCode(string voucherCode);

        /// <summary>
        /// Redeem discount voucher
        /// </summary>
        /// <param name="voucherCode">Voucher code</param>
        /// <param name="bookingReference">Booking reference</param>
        /// <param name="amount">Amount to redeem</param>
        /// <returns></returns>
        Task<string> UseDiscountVoucher(string voucherCode, string bookingReference, decimal? amount = null);

        /// <summary>
        /// Create and publish voucher.
        /// Returns id of new voucher ONLY if it was created. If it already exists method returns null.
        /// </summary>
        /// <param name="voucherId"></param>
        /// <param name="amount"></param>
        /// <param name="currency"></param>
        /// <param name="customerId"></param>
        /// <param name="meta"></param>
        /// <param name="reasonCode">Reason code</param>
        /// <param name="expirationDate"></param>
        /// <returns></returns>
        Task<string> CreateAndPublishVoucher(string voucherId, decimal amount, string currency, string customerId,
            Dictionary<string, object> meta, string reasonCode, DateTimeOffset? expirationDate = null);

        /// <summary>
        /// Get booking payments and make negative payments for them  and create voucher with amount of this payment. 
        /// If payment is deposit then make negative payments in atcom for this payment and create voucher with amount of this payment and meta reason goodwill. 
        /// If payment is not deposit then make negative payments in atcom for this payment and create voucher with amount of this payment and meta reason refund.
        /// </summary>
        /// <param name="customerId">Voucherify customer id.</param>
        /// <param name="creditBreakdown">Credit breakdown</param>
        /// <param name="voucherId">Voucher id.</param>
        /// <param name="booking">Booking object.</param>
        /// <param name="meta">Metadata.</param>
        /// <param name="markBookingAsCancelled">Mark bookings as cancelled after adding credits</param>
        /// <returns>Collection of vouchers ids which successfully added.</returns>
        Task<List<CreatedVoucher>> AddCreditToBooking(string customerId, CreditBreakdown creditBreakdown,
            string voucherId, BookingResponse booking, Dictionary<string, object> meta,
            bool markBookingAsCancelled = true);

        /// <summary>
        /// Get booking payments and make negative payments for them  and create voucher with amount of this payment. 
        /// If payment is deposit then make negative payments in atcom for this payment and create voucher with amount of this payment and meta reason goodwill. 
        /// If payment is not deposit then make negative payments in atcom for this payment and create voucher with amount of this payment and meta reason refund.
        /// </summary>
        /// <param name="customerId">Voucherify customer id.</param>
        /// <param name="bookingCancellationCreditRefundBreakdown">Credit breakdown</param>
        /// <param name="voucherId">Voucher id.</param>
        /// <param name="booking">Booking object.</param>
        /// <param name="meta">Metadata.</param>
        /// <returns>Collection of vouchers ids which successfully added.</returns>
        Task<List<CreatedVoucher>> CreateVouchersAndUpdateBooking(string customerId,
            BookingCancellationCreditRefundBreakdown bookingCancellationCreditRefundBreakdown,
            string voucherId, BookingResponse booking, Dictionary<string, object> meta);

        /// <summary>
        /// Rollback all transmitted vouchers
        /// </summary>
        /// <param name="bookingResponse"></param>
        /// <param name="vouchersToRollback"></param>
        /// <returns></returns>
        Task<bool> RollbackVouchers(BookingResponse bookingResponse, IReadOnlyCollection<CreatedVoucher> vouchersToRollback);

        /// <summary>
        /// Add refund credit to booking: create voucher, add payment and add memos
        /// </summary>
        /// <param name="customerId">Customer Id</param>
        /// <param name="refundAmount">refund amount</param>
        /// <param name="currency">currency</param>
        /// <param name="voucherId">New voucher id</param>
        /// <param name="booking">Booking</param>
        /// <param name="meta">Voucher metadata</param>
        /// <returns>Collection of created voucher ids</returns>
        Task<List<string>> AddRefundCreditToBooking(string customerId, decimal refundAmount, string currency,
            string voucherId, BookingResponse booking, Dictionary<string, object> meta);

        /// <summary>
        /// Get credit amount from cache if availalbe for current logged in customer and customer credit history flag. 
        /// </summary>
        /// <returns></returns>
        Task<Dictionary<Currency, MyCreditInfo>> MyCredits(string custId = null, bool force = false);

        /// <summary>
        /// Get credit history for current logged in cistomer
        /// </summary>
        /// <returns></returns>
        Task<Dictionary<Currency, CreditHistoryItem[]>> MyCreditHistory(string custId = null);

        /// <summary>
        /// Then a credit voucher is created for the full amount the user has paid on the booking 
        /// and the booking is marked as cancelled
        /// And a memo is added to the booking “Voucher created”
        /// And a negative payment is added to reverse all money paid on the booking onto a payment type of “credit-issued”
        /// And the payment reference will be the ID of the voucher being created
        /// Note: Multiple payments on a booking result in a single payment.
        /// </summary>        
        /// <param name="booking">Booking, should have payment information to make successful refund</param>
        /// <param name="source">Convertion source name (Call center, Web, Bulk Tool)</param>
        /// <param name="creditBreakdown">credit breakdown</param>
        /// <param name="customerId">Customer Id</param>
        /// <param name="customerDetails">Customer details if details already exists, if eq to null then will get customer details from B2B</param>
        /// <param name="isFullRefund">mark booking as canceled after</param>
        /// <returns></returns>
        Task<BookingRefundResponse> ConvertBooking(BookingResponse booking, string source,
            CreditBreakdown creditBreakdown, string customerId = null,
            CustomerDetails customerDetails = null, bool isFullRefund = true);

        /// <summary>
        /// Then a credit voucher is created for the full amount the user has paid on the booking 
        /// and the booking is marked as cancelled
        /// And a memo is added to the booking “Voucher created”
        /// And a negative payment is added to reverse all money paid on the booking onto a payment type of “credit-issued”
        /// And the payment reference will be the ID of the voucher being created
        /// Note: Multiple payments on a booking result in a single payment.
        /// </summary>        
        /// <param name="booking">Booking, should have payment information to make successful refund</param>
        /// <param name="source">Convertion source name (Call center, Web, Bulk Tool)</param>
        /// <param name="bookingCancellationCreditRefundBreakdown">credit breakdown</param>
        /// <param name="customerId">Customer Id</param>
        /// <param name="isFullRefund">mark booking as canceled after</param>
        /// <returns></returns>
        Task<BookingRefundExtendedResponse> RefundCreditsAndUpdateBooking(BookingResponse booking,
            BookingCancellationCreditRefundBreakdown bookingCancellationCreditRefundBreakdown,
            string source,
            string customerId,
            bool isFullRefund = true);

        /// <summary>
        /// Process redemptions on multiple vouchers, excluding promotional vouchers
        /// </summary>
        /// <param name="amount">Amount to spend</param>
        /// <param name="currency">Currency of credits</param>
        /// <param name="bookingReference">Booking reference</param>
        /// <param name="accomCode">Hotel code</param>
        /// <param name="bookingMarketCode">Booking market code</param>
        /// <param name="customerId">Optional customer id</param>
        /// <param name="redemptionMetadata">Redemption metadata (optional)</param>
        Task<List<CreditSpend>> SpendFilteredCredits(decimal amount, Currency currency, string bookingReference, string accomCode, string bookingMarketCode,
            string customerId = null, RedemptionMetadata redemptionMetadata = null);

        /// <summary>
        /// Process redemption on multiple vouchers
        /// </summary>
        /// <param name="amount">Amount to spend</param>
        /// <param name="currency">Currency of credits</param>
        /// <param name="bookingReference">Booking reference</param>
        /// <param name="accomCode">Hotel code</param>
        /// <param name="bookingMarketCode">Booking market code</param>
        /// <param name="customerId">Optional customer id</param>
        /// <param name="redemptionMetadata">Redemption metadata (optional)</param>
        Task<List<CreditSpend>> SpendCredits(decimal amount, Currency currency, string bookingReference,
            string accomCode, string bookingMarketCode,
            string customerId = null, RedemptionMetadata redemptionMetadata = null);

#nullable enable
        /// <summary>
        /// Get customer credit hierarchy
        /// </summary>
        /// <param name="currency"></param>
        /// <param name="bookingMarketCode"></param>
        /// <param name="customerId"></param>
        /// <returns></returns>
        public Task<List<CreditItem>> GetCreditHierarchy(Currency currency, string? bookingMarketCode,
            string? customerId = null);
#nullable disable

        /// <summary>
        /// Roll back bunch of redemptions
        /// </summary>
        /// <param name="redemptionIDs">IDs to redeem</param>
        /// <param name="reason">Reason to redeem</param>
        /// <param name="customerId">Customer ID</param>
        Task RollBackCreditRedemptions(IEnumerable<string> redemptionIDs, string reason, string customerId = null);

        /// <summary>
        /// Roll back bunch of redemptions.
        /// Also clean booking_ref memo for voucher
        /// </summary>
        /// <param name="voucherCode">Voucher code</param>
        /// <param name="redemptionIDs">IDs to redeem</param>
        /// <param name="reason">Reson to redeem</param>
        Task RollBackDiscountRedemptions(string voucherCode, IEnumerable<string> redemptionIDs, string reason);

        /// <summary>
        /// Update sourceId for existing customer with mapped id in Voucherify system if sourceId == id (customer was created without sourceid)
        /// </summary>
        /// <param name="customer">Customer details</param>
        /// <returns></returns>
        Task<bool> UpdateCustomerSourceId(CustomerDetails customer);

        /// <summary>
        /// Transfer vouchers from one account to another.
        /// Transfer only active, not expired, not redeemed vouchers.
        /// </summary>
        /// <param name="customerFrom"></param>
        /// <param name="customerTo"></param>
        /// <param name="currency"></param>
        /// <param name="getVouchersToMove"> Optional function to validate vouchers</param>
        /// <returns></returns>
        Task<TransferResult> TransferVouchers(string customerFrom, string customerTo, string currency,
            Func<IEnumerable<VoucherWithCustomer>, IEnumerable<VoucherWithCustomer>> getVouchersToMove);

        /// <summary>
        /// Validate a campaign voucher. Campaign voucher is valid if:
        /// Exists in voucherify system
        /// Active and not expired
        /// Has specific campaign metadata
        /// Not associated with any user
        /// </summary>
        /// <param name="voucherCode"></param>
        /// <returns></returns>
        Task<ValidateVoucher> Validate(string voucherCode);

        /// <summary>
        /// Convert campaign voucher to user credits.
        /// Redeem custom campaign voucher.
        /// Create a copy (clone) inside user credits campaign with the appropriate metadata and new expiration date specified in the old voucher metadata.
        /// </summary>
        /// <param name="voucherCode"></param>
        /// <returns></returns>
        Task<ValidateVoucher> ConvertVoucherToCredits(string voucherCode);

        /// <summary>
        /// Gets the refund credit amount from the memo description
        /// </summary>
        /// <param name="bookingResponse"></param>
        /// <returns></returns>
        decimal? GetRefundAmountFromCreditRefundMemo(BookingResponse bookingResponse);

        /// <summary>
        /// Get single use promo code.
        /// </summary>
        /// <param name="campaignId">Campaign Id.</param>
        /// <returns>Single user promo code.</returns>
        Task<string> GetSingleUsePromoCode(string campaignId);
    }
}