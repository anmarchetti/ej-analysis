using easyJet.Holidays.Api.Domain.Data.Settings;

namespace easyJet.Holidays.Api.Domain.Interfaces.Cms
{
    /// <summary>
    /// Service to get access to Settigns items in Sitecore
    /// </summary>
    public interface ISettingsService
    {
        /// <summary>
        /// get price breakdown settings
        /// </summary>
        /// <returns></returns>
        Task<PriceBreakdownResponse> GetPriceBreakdownSettings();

        /// <summary>
        /// Get collection of EligibleForCancelCredit rules
        /// </summary>
        /// <returns></returns>
        Task<CreditAndCashRefundSettings> GetCancelCreditSettings();

        /// <summary>
        /// Get promo cache busting setting
        /// </summary>
        /// <returns>PromoCacheBustingSetting domain model</returns>
        Task<PromoCacheBustingSetting> GetPromoCacheBustingSetting();

        /// <summary>
        /// Get locked accounts settings
        /// </summary>
        /// <returns>LockedAccountSetting domain model</returns>
        Task<LockedAccountSettings> GetLockedAccountSetting();

        /// <summary>
        /// Get whitelist of allowed trade agent names
        /// </summary>
        /// <returns></returns>
        Task<AllowedTradeAgentNamesSettings> GetAllowedTradeAgentNamesSettings();

        /// <summary>
        /// Get all market settings mapped to languages
        /// </summary>
        /// <returns></returns>
        Task<Dictionary<string, MarketSettings>> GetAllMarketSettings();

        /// <summary>
        /// Get Session timeout settings
        /// </summary>
        /// <returns></returns>
        Task<SessionSettings> GetSessionSettings(bool forceCacheUpdate = false);

        /// <summary>
        /// Get Seat Map Settings
        /// </summary>
        /// <returns></returns>
        Task<SeatMapSettings> GetSeatMapSettings();
    }
}
