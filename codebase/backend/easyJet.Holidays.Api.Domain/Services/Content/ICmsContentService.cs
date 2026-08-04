using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.RecommendedDestination;

namespace easyJet.Holidays.Api.Domain.Services.Content
{
    public interface ICmsContentService
    {
        /// <summary>
        /// Get heals enrty requirements fro specific airport.
        /// </summary>
        /// <param name="airportCode">Airport to search</param>
        /// <param name="isFlightAndHotel">Whether this is a Flight and Hotel booking (uses different Sitecore item)</param>
        /// <returns></returns>
        Task<List<HealthEntryRequirement>> GetHealthEntryRequirementsForAirport(string airportCode, bool isFlightAndHotel = false);

        /// <summary>
        /// Get all recommended destinations.
        /// </summary>
        /// <returns></returns>
        Task<Dictionary<string, CmsRecommendedDestination>> GetAllRecommendedDestinations();

        /// <summary>
        /// Get all destinations' codes with "Something different" tag
        /// </summary>
        /// <returns></returns>
        Task<IEnumerable<string>> GetSomethingDifferentDestinationsCodes();
    }
}
