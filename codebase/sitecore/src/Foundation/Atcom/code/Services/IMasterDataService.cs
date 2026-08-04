using System.Collections.Generic;
using easyJet.Foundation.Atcom.Models;

namespace easyJet.Foundation.Atcom.Services
{
    public interface IMasterDataService
    {
        /// <summary>
        /// Get room codes from atcom.
        /// </summary>
        /// <param name="languageCode">iso language code for which to get rooms.</param>
        /// <returns>Collection of room codes.</returns>
        IEnumerable<DataObject> GetRoomCodes(string languageCode = null);

        /// <summary>
        /// Get room facilities from atcom.
        /// </summary>
        /// <returns>Collection of room facilities.</returns>
        IEnumerable<DataObject> GetRoomFacilities();

        /// <summary>
        /// Get star rating codes from atcom.
        /// </summary>
        /// <returns>Collection of star rating codes.</returns>
        IEnumerable<DataObject> GetStarRatingCodes();

        /// <summary>
        /// Get country codes from atcom.
        /// </summary>
        /// <returns>Collection of country codes.</returns>
        IEnumerable<DataObject> GetCountryCodes();

        /// <summary>
        /// Get airports by country code from atcom.
        /// </summary>
        /// <param name="countryCode">Country code.</param>
        /// <returns>Collection of airports.</returns>
        IEnumerable<DataObject> GetAirports(string countryCode);

        /// <summary>
        /// Get regions codes by country code from atcom.
        /// </summary>
        /// <param name="countryCode">Country code.</param>
        /// <returns>Collection of codes.</returns>
        IEnumerable<DataObject> GetLocationCodes(string countryCode);

        /// <summary>
        /// Get resorts codes by region from atcom.
        /// </summary>
        /// <param name="locationCode">Region code.</param>
        /// <returns>Collection of codes.</returns>
        IEnumerable<DataObject> GetResortCodes(string locationCode);

        /// <summary>
        /// Get accommodations from atcom by resort code.
        /// </summary>
        /// <param name="resortCode">Resort code.</param>
        /// <returns>Collection of accommodation objects.</returns>
        IEnumerable<AtcomAccommodationMasterDataObject> GetAccommodations(string resortCode);
    }
}