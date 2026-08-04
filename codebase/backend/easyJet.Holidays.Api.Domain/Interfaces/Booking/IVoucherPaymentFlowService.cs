using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Data.Vouchers;

namespace easyJet.Holidays.Api.Domain.Interfaces.Booking;

public interface IVoucherPaymentFlowService
{
    /// <summary>
    /// Redeem payment
    /// </summary>
    /// <param name="amount"></param>
    /// <param name="bookingReference"></param>
    /// <param name="accomCode"></param>
    /// <param name="customerId"></param>
    /// <param name="bookingMarketCode"/>
    /// <param name="redemptionMetadata">Redemption metadata: action, source, etc. (optional)</param>
    /// <returns></returns>
    Task<List<CreditSpend>> Redeem(decimal amount, string currency, string bookingReference, string accomCode, string bookingMarketCode, string customerId = null, RedemptionMetadata redemptionMetadata = null);

    /// <summary>
    /// Add payment information to booking
    /// </summary>
    /// <param name="spendVoucherResults"></param>
    /// <param name="leadPassenger"></param>
    /// <param name="bookingReference"></param>
    /// <param name="bookingMarket"></param>
    /// <param name="bookingLanguage"></param>
    /// <param name="sessionId"></param>
    /// <param name="requestId"></param>
    /// <param name="promotionCollections"></param>
    /// <returns></returns>
    Task AddPaymentInfo(List<CreditSpend> spendVoucherResults, LeadPassenger leadPassenger, string bookingReference, string bookingMarket, string bookingLanguage, string sessionId, string requestId, IList<string> promotionCollections = null);

    /// <summary>
    /// Rollback transactions
    /// </summary>
    /// <param name="spendVoucherResults"></param>
    /// <param name="customerId">Customer ID</param>
    /// <returns></returns>
    Task<ApiException> Rollback(List<CreditSpend> spendVoucherResults, string customerId = null);

    /// <summary>
    /// Process redemptions on multiple vouchers, excluding promotional vouchers
    /// </summary>
    /// <param name="amount"></param>
    /// <param name="currency"></param>
    /// <param name="bookingReference"></param>
    /// <param name="accomCode"></param>
    /// <param name="customerId"></param>
    /// <param name="bookingMarketCode"/>
    /// <param name="redemptionMetadata">Redemption metadata: action, source, etc. (optional)</param>
    /// <returns></returns>
    Task<List<CreditSpend>> RedeemFiltered(decimal amount, string currency, string bookingReference, string accomCode, string bookingMarketCode, string customerId = null, RedemptionMetadata redemptionMetadata = null);
}