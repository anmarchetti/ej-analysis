using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.External.Atcom.Models.Internal.Search;

namespace easyJet.Holidays.External.AWS.LivePriceSync.Services;

/// <summary>
/// 
/// </summary>
public interface IOffersPreparationService
{
    /// <summary>
    /// 
    /// </summary>
    /// <param name="offers"></param>
    /// <param name="sponsoredHotels"></param>
    /// <returns></returns>
    Task<List<Offer>> MapAndEnrichOffers(List<AvCacheResultOffersOffer> offers, string[] sponsoredHotels);
}