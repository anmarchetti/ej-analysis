using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.RoomVariants;

namespace easyJet.Holidays.Api.Domain.Interfaces.DiscountedOffer;

/// <summary>
/// Service that enriches offer models with discount related data (e.g. discount percentage, promotional flags)
/// for different search request contexts.
/// </summary>
public interface IHbgHotelDiscountsService
{
    /// <summary>
    /// Enriches the provided collection of offers with discount information when no additional request context is required.
    /// </summary>
    /// <param name="offers">Mutable collection of offers to be enriched. Each offer will be updated in place.</param>
    /// <returns>Task that completes when enrichment is finished.</returns>    
    Task EnrichOffersWithDiscounts(IList<Offer> offers);
}