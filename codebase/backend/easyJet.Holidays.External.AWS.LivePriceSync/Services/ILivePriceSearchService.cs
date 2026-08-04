using easyJet.Holidays.Api.Domain.Data.LivePrice;
using easyJet.Holidays.External.Atcom.Models.Internal.Search;

namespace easyJet.Holidays.External.AWS.LivePriceSync.Services;

public interface ILivePriceSearchService
{
    /// <summary>
    /// Send Request to Atcom to get offers by specified criteria
    /// </summary>
    /// <param name="namedSearch"></param>
    /// <param name="countryCodes"></param>
    /// <param name="range"></param>
    /// <param name="departurePoints"></param>
    /// <returns></returns>
    Task<List<AvCacheResultOffersOffer>> DoSearch(NamedSearch namedSearch, IEnumerable<string> countryCodes, DateRange range, string departurePoints, string marketCode);

    /// <summary>
    /// Filter offers by theme. Uses startsWith for codes comparison. 
    /// </summary>
    /// <param name="originalSet"></param>
    /// <param name="themeCodes"></param>
    /// <returns></returns>
    List<AvCacheResultOffersOffer> FilterByTheme(List<AvCacheResultOffersOffer> originalSet, IEnumerable<string> themeCodes);
}