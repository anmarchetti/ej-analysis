using easyJet.Holidays.Api.Domain.Data.FlightPriceStore;

namespace easyJet.Holidays.External.AWS.Services.FlightPrice;

/// <summary>
/// Repository for FlightPriceStore 
/// </summary>
public interface IFlightPriceStoreService
{
    /// <summary>
    /// Returns all records that: <br />
    /// - have a departure date > today - 2 <br />
    /// - have their FareType set to 'STANDARD' <br />
    /// - have a currency that is in the currencies param
    /// </summary>
    /// <param name="referenceDate"></param>
    /// <param name="currencies">currencies to filter for</param>
    /// <returns></returns>
    Task<IEnumerable<FlightPriceStoreModel>> GetDailyItems(DateTime referenceDate, string[] currencies);

    /// <summary>
    /// 
    /// </summary>
    /// <param name="models"></param>
    /// <returns></returns>
    Task StorePrices(IEnumerable<FlightPriceStoreModel> models);

    /// <summary>
    /// 
    /// </summary>
    /// <param name="flightKey"></param>
    /// <param name="updateAvailabilityToZero"></param>
    /// <returns></returns>
    Task<IEnumerable<FlightPriceStoreModel>> EvictFlightPrices(string flightKey, bool updateAvailabilityToZero);
}