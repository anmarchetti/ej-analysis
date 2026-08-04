using System.Collections.Generic;
using System.Threading.Tasks;
using easyJet.Foundation.Destinations.Models.Domain;

namespace easyJet.Foundation.Destinations.Services
{
    public interface IReferenceDataService
    {
        /// <summary>
        /// Gets all board types from Sitecore.
        /// </summary>
        /// <returns>Collection of Board Types.</returns>
        IEnumerable<BoardType> GetAllBoardTypes();

        /// <summary>
        /// Gets all countries stored in Sitecore.
        /// </summary>
        /// <returns>Collection of Countries.</returns>
        IEnumerable<UserCountry> GetAllCountries();

        /// <summary>
        /// Gets all Dialing Codes stored in Sitecore.
        /// </summary>
        /// <returns>Collection of Dialing Codes.</returns>
        IEnumerable<DialingCode> GetAllDialingCodes();

        /// <summary>
        /// Gets all Room Types stored in Sitecore.
        /// </summary>
        /// <returns>Collection of Room Types.</returns>
        IEnumerable<RoomType> GetAllRoomTypes();

        /// <summary>
        /// Gets Room Types from Sitecore.
        /// </summary>
        /// <param name="page">Page #.</param>
        /// <param name="take">Number of items to take.</param>
        /// <returns>Collection of Room Types.</returns>
        RoomTypesPaged GetRoomTypes(int page, int take);

        /// <summary>
        /// Get all hotel codes.
        /// </summary>
        /// <returns>Collection of hotel codes.</returns>
        IEnumerable<string> GetHotelCodes();

        /// <summary>
        /// Get Dictionary with Accomodation codes -> Giata codes mapping.
        /// would look like Union of Cartesian products { {{AccommodationCodes1} × Giata1} ⋃ {{AccommodationCodes2} × Giata2} ... }.
        /// </summary>
        /// <param name="accommodationCodes">List of accommodation codes</param>
        /// <returns></returns>
        Task<IDictionary<string, string>> GetAccommodationToGiataMapping(List<string> accommodationCodes);

        /// <summary>
        /// Get filter pills configuration from Sitecore.
        /// </summary>
        /// <returns>Filter pills configuration.</returns>
        FilterPillsConfig GetFilterPillsConfig();
    }
}