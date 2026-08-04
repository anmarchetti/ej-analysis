using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.External.Atcom.Models.Internal.Search;
using easyJet.Holidays.External.Atcom.Models.Search;

namespace easyJet.Holidays.External.Atcom.Mappers.Search;

/// <summary>
/// Mappers for offers
/// </summary>
public interface IOffersMapper
{
    /// <summary>
    /// Converts search offers to web offers
    /// </summary>
    /// <param name="offers">Atcom search offers</param>
    /// <param name="sponsoredHotels">ids of sponsored hotels</param>
    /// <param name="marketSettings">market settings</param>
    /// <param name="getOfferId">offer id function, otherwise index</param>
    /// <returns></returns>
    Task<List<Offer>> ConvertOffers(IEnumerable<AvCacheResultOffersOffer> offers, string[] sponsoredHotels, MarketSettings marketSettings, Func<int, int> getOfferId = null);
    /// <summary>
    /// Maps Atcom search response to web response
    /// </summary>
    /// <param name="response">Atcom search response</param>
    /// <param name="marketSettings">Market settings</param>
    /// <returns></returns>
    Task<SearchOffersResponse> Map(SearchAvailablePackagesResponse response, MarketSettings marketSettings);
}