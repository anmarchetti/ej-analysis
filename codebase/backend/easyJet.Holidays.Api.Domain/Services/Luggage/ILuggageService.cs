using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Luggage;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.RoomVariants;

namespace easyJet.Holidays.Api.Domain.Services.Luggage;

/// <summary>
/// Luggage Service
/// </summary>
public interface ILuggageService
{
    /// <summary>
    /// Offer complimentary luggage, based on BookingPackage.
    /// </summary>
    Task<IEnumerable<ExtraLuggageItem>> GetComplimentaryLuggage(BookingPackage package);

    /// <summary>
    /// Get complimentary luggage, based on Offer.
    /// </summary>
    Task<IEnumerable<ExtraLuggageItem>> GetComplimentaryLuggage(Offer offer);

    /// <summary>
    /// Offer hold luggage, based on sitecore luggage configuration.
    /// </summary>
    /// <param name="offer">Offer from Atcome cache.</param>
    /// <param name="request">Request from frontend.</param>
    /// <returns>Extra hold luggage items.</returns>
    Task<IEnumerable<ExtraLuggageItem>> GetHoldLuggageOffer(Offer offer, AccommodationOfferRequest request);

    /// <summary>
    /// Offer LCB luggage, based on sitecore luggage configuration.
    /// </summary>
    /// <param name="offer">Offer from Atcome cache.</param>
    /// <param name="request">Request from frontend.</param>
    /// <returns>Extra large cabin bag luggage items.</returns>
    Task<IEnumerable<ExtraLuggageItem>> GetLargeCabinBagLuggageOffer(Offer offer, AccommodationOfferRequest request);

    /// <summary>
    /// Process luggage items
    /// </summary>
    Task ValidateBookingLuggage(ValidateBookingRequest request);

    /// <summary>
    /// Checks if luggage items contains Sport Equipment.
    /// </summary>
    /// <param name="luggageItems">Luggage items</param>
    Task<bool> ContainsSportEquipment(IEnumerable<ExtraLuggageItem> luggageItems);

    /// <summary>
    /// Builds an index of luggage configuration items by their code.
    /// </summary>
    /// <param name="luggage">Luggage</param>
    IDictionary<string, LuggageConfigurationItem> GetLuggageCategoriesIndex(
        Data.ReferenceData.Luggage.Luggage luggage);
}