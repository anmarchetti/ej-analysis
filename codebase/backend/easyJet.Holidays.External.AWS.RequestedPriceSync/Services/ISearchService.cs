using easyJet.Holidays.Api.Domain.Data.Destinations;
using easyJet.Holidays.Api.Domain.Data.RequestedPrice;
using easyJet.Holidays.External.Atcom.Models.Extensions;

namespace easyJet.Holidays.External.AWS.RequestedPriceSync.Services;

/// <summary>
/// searches atcom cache
/// </summary>
public interface ISearchService
{
    /// <summary>
    /// executes a search against atcom cache based on the passed named search
    /// </summary>
    /// <param name="namedSearchRequest"></param>
    /// <param name="destinationItems"></param>
    /// <returns></returns>
    Task<List<AvCacheResultOffersOfferExtended>> Search(RequestedPriceNamedSearch namedSearchRequest, List<DestinationItem> destinationItems);
}