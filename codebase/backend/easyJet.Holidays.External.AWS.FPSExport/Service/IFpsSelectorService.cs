using easyJet.Holidays.Api.Domain.Data.FlightPriceStore;

namespace easyJet.Holidays.External.AWS.FPSExport.Service;

/// <summary>
/// Bundles functionality for filtering and selecting correct Prices
/// </summary>
public interface IFpsSelectorService
{
    /// <summary>
    /// selects appropriate price
    /// </summary>
    /// <param name="records"></param>
    /// <returns></returns>
    IList<FlightPriceStoreModel> SelectFare(IList<FlightPriceStoreModel> records);
}