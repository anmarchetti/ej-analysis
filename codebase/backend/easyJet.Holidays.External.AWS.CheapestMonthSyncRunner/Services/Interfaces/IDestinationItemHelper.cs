using easyJet.Holidays.Api.Domain.Data.Destinations;
using easyJet.Holidays.External.AWS.Models.CheapestMonth;

namespace easyJet.Holidays.External.AWS.CheapestMonthSyncRunner.Services.Interfaces;
/// <summary>
/// IDestinationItemHelper
/// </summary>
public interface IDestinationItemHelper
{
    /// <summary>
    /// Gets the all regions details.
    /// </summary>
    /// <param name="destinations">The destinations.</param>
    /// <returns>A list of RegionDetails.</returns>
    IList<RegionDetails> GetAllRegionsDetails(IList<DestinationItem> destinations);
}
