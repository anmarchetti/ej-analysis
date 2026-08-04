namespace easyJet.Holidays.Api.Domain.Interfaces.SingleUseVoucher;

/// <summary>
/// Single use promo code service
/// </summary>
public interface ISingleUseVoucherService
{
    /// <summary>
    /// Assign an available single-use promo code to a customer in a campaign.
    /// </summary>
    /// <param name="customerMappedId">Mapped customer ID.</param>
    /// <param name="campaignId">Campaign ID.</param>
    /// <returns>Existing or newly assigned single-use promo code, or empty string when none is available.</returns>
    Task<string> AssignSingleUsePromoCodeToCustomer(string customerMappedId, string campaignId);

    /// <summary>
    /// Get customer single user promo code
    /// </summary>
    /// <param name="customerId">Customer ID.</param>
    /// <param name="campaignId">Campaign ID.</param>
    /// <returns>Single Use Promo Code.</returns>
    Task<string> GetCustomerSingleUserPromoCode(string customerId, string campaignId);
}
