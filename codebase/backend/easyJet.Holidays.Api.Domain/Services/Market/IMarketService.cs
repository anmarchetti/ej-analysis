using easyJet.Holidays.Api.Domain.Data.Settings;

namespace easyJet.Holidays.Api.Domain.Services.Market
{
    public interface IMarketService
    {
        /// <summary>
        /// Returns current market settings based on current context language.
        /// </summary>
        /// <returns></returns>
        MarketSettings GetCurrentMarket();

        /// <summary>
        /// Returns market settings based on market code
        /// </summary>
        /// <returns></returns>
        MarketSettings GetMarket(string marketCode);

        /// <summary>
        /// Returns currency based on market code
        /// </summary>
        /// <returns></returns>
        string GetCurrencyFromMarketCode(string marketCode);
        MarketSettings GetMarketByLanguageCode(string languageCode);

        /// <summary>
        /// Validates, that a given currency code is known to us and in a market that we service
        /// </summary>
        /// <param name="currencyCode">the currency code to validate against our markets</param>
        /// <returns>true, if currency is associated with one of our markets</returns>
        bool IsValidCurrency(string currencyCode);
    }
}
