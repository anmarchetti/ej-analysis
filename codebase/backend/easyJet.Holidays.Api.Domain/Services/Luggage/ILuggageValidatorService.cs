using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;

namespace easyJet.Holidays.Api.Domain.Services.Luggage
{
    /// <summary>
    /// Luggage Validator Service.
    /// </summary>
    public interface ILuggageValidatorService
    {
        /// <summary>
        /// Validates luggage.
        /// </summary>
        Task Validate(List<ExtraLuggageItem> luggageItems, PersonWithDetails[] guests, string[] routeIds);

        /// <summary>
        /// Validate luggage within accommodation offer.
        /// </summary>
        /// <param name="offer">Offer response.</param>
        Task ValidateAccommodationOffer(Offer offer);

        /// <summary>
        /// Validates complimentary luggage by promotion.
        /// </summary>
        /// <returns></returns>
        Task ValidateComplimentaryLuggage(string promotionCode, List<ExtraLuggageItem> luggageItems, PersonWithDetails[] guests, Route[] routeIds);
    }
}
