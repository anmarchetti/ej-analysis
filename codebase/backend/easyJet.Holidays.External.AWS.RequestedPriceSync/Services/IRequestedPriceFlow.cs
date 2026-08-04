using easyJet.Holidays.External.AWS.Services.RequestedPrice.Models;

namespace easyJet.Holidays.External.AWS.RequestedPriceSync.Services;

/// <summary>
/// Flow for a requested price, start to finish
/// </summary>
public interface IRequestedPriceFlow
{
    /// <summary>  
    /// Processes requested prices for a given input.  
    /// This includes fetching named search offers, aggregating data, saving results,  
    /// and optionally deleting older data based on the input's timestamp.  
    /// Handles exceptions during fetching and aggregation, and logs relevant details.  
    /// </summary>  
    /// <param name="input">The input containing market, language, and other details for synchronization.</param>  
    /// <returns>A task representing the asynchronous operation.</returns>
    Task Process(RequestedPriceSyncInput input);
}