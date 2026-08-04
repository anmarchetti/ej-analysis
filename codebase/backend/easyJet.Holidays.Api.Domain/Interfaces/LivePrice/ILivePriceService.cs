using easyJet.Holidays.Api.Domain.Data.LivePrice;

namespace easyJet.Holidays.Api.Domain.Interfaces.LivePrice
{
    /// <summary>
    /// Live pricing service
    /// </summary>
    public interface ILivePriceService
    {
        /// <summary>
        /// Get live price by keys which may contain geography code and theme: ES, ES.beach, X00001.city
        /// </summary>
        /// <param name="key">Comma separated collection of keys e.g. "ES,ESBA.beach"</param>
        /// <returns></returns>
        Task<IEnumerable<LivePriceSummaryModel>> GetPrice(IEnumerable<string> key);

        /// <summary>
        /// Save model in DynamoDB table
        /// </summary>
        /// <param name="settings">DynamoDB settings</param>
        /// <param name="expiresDays">Expiration days for DynamoDB(TTL)</param>
        /// <param name="data">Items dictionary grouped by geography code (country, location, resort) </param>
        /// <returns></returns>
        Task Save(LivePriceTableSetting settings, Dictionary<string, GeogPricesModel> data, int expiresDays);

        /// <summary>
        /// Delete live price items created before specified time (Unix time seconds)
        /// </summary>
        /// <param name="settings">Settings</param>
        /// <param name="seconds">Unix time seconds</param>
        /// <returns></returns>
        Task DeleteOlderThan(LivePriceTableSetting settings, long seconds, string market);
    }
}
