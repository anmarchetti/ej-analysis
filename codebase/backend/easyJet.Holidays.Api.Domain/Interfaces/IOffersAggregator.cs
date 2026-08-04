using easyJet.Holidays.Api.Domain.Data.Hotels;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;

namespace easyJet.Holidays.Api.Domain.Interfaces;

public interface IOffersAggregator
{
    Task<SearchOffersResponse> Combine(SearchOffersResponse packages, IEnumerable<Hotel> hotels, BaseSearchRequest request = null);

    /// <summary>
    /// Enrich accom with room and board information. Return cms hotel info.
    /// </summary>
    /// <param name="accom">Offer accom.</param>
    /// <param name="hotels">Cms hotel information.</param>
    /// <returns>Cms hotel info.</returns>
    Task<OfferHotel> EnrichAccomWithHotelInfo(Accom accom, IEnumerable<Hotel> hotels);
}