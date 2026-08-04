using easyJet.Foundation.Destinations.Models.Domain.CancelAndCredit;

namespace easyJet.Foundation.Destinations.Services
{
    /// <summary>
    /// Eligible for Cancel And Credit Rules Service.
    /// </summary>
    public interface ICancelCreditSettingsService
    {
        /// <summary>
        /// Get Credit and Cash Refund Settings.
        /// </summary>
        /// <returns>Credit and Cash Refund Settings.</returns>
        CreditAndCashRefundSettings GetCancelCreditSetting();
    }
}
