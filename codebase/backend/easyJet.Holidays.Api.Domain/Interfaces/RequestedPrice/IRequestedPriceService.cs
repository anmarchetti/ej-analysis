using easyJet.Holidays.Api.Domain.Data.RequestedPrice;

namespace easyJet.Holidays.Api.Domain.Interfaces.RequestedPrice;

/// <summary>
/// Repository for requested prices
/// </summary>
public interface IRequestedPriceService
{
    /// <summary>
    /// Get requested price by keys which may contain geography code and theme: ES, ES.beach, X00001.city
    /// </summary>
    /// <param name="keys">Comma separated collection of keys e.g. "ES,ESBA.beach"</param>
    /// <returns></returns>
    Task<IEnumerable<RequestedPriceSummaryModel>> GetPrice(IEnumerable<string> keys);

    /// <summary>
    /// Save model in DynamoDB table
    /// </summary>
    /// <param name="data">Items dictionary grouped by geography code (country, location, resort) </param>
    /// <returns></returns>
    Task Save(IDictionary<string, PricesModel> data);

    /// <summary>
    /// Delete requested price items created before specified time (Unix time seconds)
    /// </summary>
    /// <param name="seconds">Unix time seconds</param>
    /// <param name="marketCodeAndLanguage">Market code and language</param>
    /// <returns></returns>
    Task DeleteOlderThan(long seconds, string marketCodeAndLanguage);
}