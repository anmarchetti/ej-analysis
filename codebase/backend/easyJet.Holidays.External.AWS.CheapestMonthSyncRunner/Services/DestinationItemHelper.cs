using easyJet.Holidays.Api.Domain.Data.Destinations;
using easyJet.Holidays.External.AWS.CheapestMonthSyncRunner.Services.Interfaces;
using easyJet.Holidays.External.AWS.Models.CheapestMonth;

namespace easyJet.Holidays.External.AWS.CheapestMonthSyncRunner.Services;
/// <summary>
/// DestinationItemHelper
/// </summary>
public class DestinationItemHelper : IDestinationItemHelper
{
/// <inheritdoc/>

    public IList<RegionDetails> GetAllRegionsDetails(IList<DestinationItem> destinations)
    {
        var regionDetails = destinations
                .Where(d => d.Type == DestinationItemType.Region ||
                        d.Type == DestinationItemType.VirtualRegion ||
                        d.Type == DestinationItemType.Resort)
                .Select(r => new RegionDetails
                {
                    CountryCode = string.Join(",", (r.Parents ?? Enumerable.Empty<DestinationItem>()).OrderBy(p => p.Code.Length).Select(p => p.Code)),
                    RegionCode = r.Code,
                    RelatedRegions = r.RelatedRegions
                }).ToList();

        return regionDetails;
    }
}
