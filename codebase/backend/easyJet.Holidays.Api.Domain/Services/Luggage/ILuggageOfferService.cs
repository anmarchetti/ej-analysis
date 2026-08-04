using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.RoomVariants;

namespace easyJet.Holidays.Api.Domain.Services.Luggage;

/// <summary>
/// Luggage offer service, responsible for adding luggage to offers.
/// </summary>
public interface ILuggageOfferService
{
    /// <summary>
    /// Adds all luggage with prices to Offers.
    /// </summary>
    Task EnrichOffersWithLuggage(IEnumerable<Offer> offers, AccommodationOfferRequest request);

    /// <summary>
    /// Adds complimentary luggage to Offers.
    /// </summary>
    Task EnrichOffersWithComplimentaryLuggage(IEnumerable<Offer> offers);
}