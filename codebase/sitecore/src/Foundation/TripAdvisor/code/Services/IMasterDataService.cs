using easyJet.Foundation.TripAdvisor.Models.Domain;

namespace easyJet.Foundation.TripAdvisor.Services
{
    public interface IMasterDataService
    {
        /// <summary>
        /// Get location by hotel code or trip avisor id.
        /// </summary>
        /// <param name="locationId">Hotel code or trip advisor id.</param>
        /// <returns>Location.</returns>
        Location GetLocation(string locationId);

        /// <summary>
        /// Get location by coordinates and hotel name.
        /// </summary>
        /// <param name="latitude">Latitude of hotel.</param>
        /// <param name="longitude">longitude of hotel.</param>
        /// <param name="name">Name of hotel.</param>
        /// <returns>Mapped location by coordinates and hotel name.</returns>
        MappedLocation GetLocationByCoordinatesAndHotelName(string latitude, string longitude, string name);
    }
}