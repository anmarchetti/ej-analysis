using System.Collections.Generic;
using easyJet.Foundation.Atcom.Models.Domain;
using easyJet.Foundation.Atcom.Models.External;
using Sitecore.Data;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Atcom.Services.Sync
{
    public interface ISyncDataService
    {
        /// <summary>
        /// Sync room types from Atcom.
        /// </summary>
        /// <param name="templateId">Template id.</param>
        /// <param name="parent">Parent item.</param>
        /// <returns>Collection of synced items.</returns>
        IEnumerable<Item> SyncRoomTypes(ID templateId, Item parent);

        /// <summary>
        /// Sync room facilities from Atcom.
        /// </summary>
        /// <param name="templateId">Template id.</param>
        /// <param name="parent">Parent item.</param>
        /// <returns>Collection of synced items.</returns>
        IEnumerable<Item> SyncRoomFacilities(ID templateId, Item parent);

        /// <summary>
        /// Sync star rating from Atcom.
        /// </summary>
        /// <param name="templateId">Template id.</param>
        /// <param name="parent">Parent item.</param>
        /// <returns>Collection of synced items.</returns>
        IEnumerable<Item> SyncStarRatings(ID templateId, Item parent);

        /// <summary>
        /// Sync countries from Atcom.
        /// </summary>
        /// <param name="templateId">Template id.</param>
        /// <param name="parent">Parent item.</param>
        /// <returns>Collection of synced items.</returns>
        IEnumerable<Item> SyncCountries(ID templateId, Item parent);

        /// <summary>
        /// Sync airport countries from Atcom.
        /// </summary>
        /// <param name="templateId">Template id.</param>
        /// <param name="parent">Parent item.</param>
        /// <returns>Collection of synced items.</returns>
        IEnumerable<Item> SyncAirportsCountries(ID templateId, Item parent);

        /// <summary>
        /// Sync airports by country from Atcom.
        /// </summary>
        /// <param name="countryCode">Country code.</param>
        /// <param name="templateId">Template id.</param>
        /// <param name="parent">Parent item.</param>
        /// <returns>Collection of synced items.</returns>
        IEnumerable<Item> SyncAirports(string countryCode, ID templateId, Item parent);

        /// <summary>
        /// Sync locations by country from Atcom.
        /// </summary>
        /// <param name="countryCode">Country code.</param>
        /// <param name="templateId">Template id.</param>
        /// <param name="parent">Parent item.</param>
        /// <returns>Collection of synced items.</returns>
        IEnumerable<Item> SyncLocations(string countryCode, ID templateId, Item parent);

        /// <summary>
        /// Sync resorts by location from Atcom.
        /// </summary>
        /// <param name="locationCode">Location code.</param>
        /// <param name="templateId">Template id.</param>
        /// <param name="parent">Parent item.</param>
        /// <returns>Collection of synced items.</returns>
        IEnumerable<Item> SyncResorts(string locationCode, ID templateId, Item parent);

        /// <summary>
        /// Sync accommodations by resort from Atcom.
        /// </summary>
        /// <param name="resortCode">Resort code.</param>
        /// <param name="templateId">Template id.</param>
        /// <param name="parent">Parent item.</param>
        /// <param name="vrpDataByCode">Vrp data by code.</param>
        /// <param name="accommodationsByCode">Accommodation data by code.</param>
        /// <returns>Collection of synced items.</returns>
        IEnumerable<Item> SyncAccommodations(string resortCode, ID templateId, Item parent, Dictionary<string, AccommodationHeaderDataEntry> vrpDataByCode = null, Dictionary<string, AtcomAccommodation> accommodationsByCode = null);

        /// <summary>
        /// Sync special requests from Atcom.
        /// </summary>
        /// <param name="templateId">Template id.</param>
        /// <param name="parent">Parent item.</param>
        /// <returns>Collection of synced items.</returns>
        IEnumerable<Item> SyncSpecialRequests(ID templateId, Item parent);

        /// <summary>
        /// Sync accomodation room types.
        /// </summary>
        /// <returns>Collection of synced items.</returns>
        IEnumerable<Item> SyncAccommodationRoomTypes();

        /// <summary>
        /// Sync room type facilities.
        /// </summary>
        /// <param name="templateId">Template id.</param>
        /// <param name="parent">Parent item.</param>
        /// <returns>Collection of synced items.</returns>
        IEnumerable<Item> SyncRoomTypeFacilities(ID templateId, Item parent);
    }
}