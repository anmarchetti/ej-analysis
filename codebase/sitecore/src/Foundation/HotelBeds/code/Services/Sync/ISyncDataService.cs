using System;
using System.Collections.Generic;
using easyJet.Foundation.HotelBeds.Exceptions;
using easyJet.Foundation.HotelBeds.Models.Domain;
using Sitecore.Data;
using Sitecore.Data.Items;

namespace easyJet.Foundation.HotelBeds.Services.Sync
{
    public interface ISyncDataService
    {
        IEnumerable<Item> SyncFacilityTypologies(ID templateId, Item parent);

        IEnumerable<Item> SyncFacilityGroups(ID templateId, Item parent, DateTime? lastUpdateTime = null);

        IEnumerable<Item> SyncFacilities(string code, ID templateId, Item parent, DateTime? lastUpdateTime = null);

        IEnumerable<Item> UpdateAccommodations(IDictionary<string, Item> hotelBedsCodeAccommodationItemMapping, string language = null, DateTime? lastUpdateTime = null, bool shouldUpdateAccommodationImages = false);

        IEnumerable<Item> SyncRoomTypes(ID templateId, Item parent, DateTime? lastUpdateTime = null);

        IEnumerable<Item> SyncAccommodationFacilities(string hotelBedsCode, Item hotelItem, string dataFolder = null, string language = null, DateTime? lastUpdateTime = null);

        IEnumerable<Item> SyncAccommodationImages(string hotelBedsCode, Item hotelItem, string language = null, DateTime? lastUpdateTime = null);

        IEnumerable<Item> SyncAccommodationRooms(Accommodation accommodation, Item hotelItem, string dataFolder = null, DateTime? lastUpdateTime = null, bool shouldUpdateAccommodationImages = true);

        IEnumerable<Item> SyncAccommodationBoards(string hotelBedsCode, Item hotelItem, string language = null, DateTime? lastUpdateTime = null);

        /// <summary>
        /// Resync images from HotelBeds.
        /// </summary>
        /// <param name="items">Collection of hotels which need to resync.
        /// Where 'key' - Hotel beds code.
        /// and 'value' - Collection of potentinaly broken hotel's images.
        /// </param>
        /// <returns name="proccededItems">Collection of proceeded items.</returns>
        List<Item> ResyncImages(Dictionary<string, HotelItem> items);

        /// <summary>
        /// Resync facilities from HotelBeds.
        /// </summary>
        /// <param name="items">Collection of hotels which needed to be resynced.
        /// Where 'key' - Hotel beds code.
        /// and 'value' - Collection of facilities which needed to be deleted.
        /// </param>
        /// <returns name="proccededItems">Collection of proceeded items.</returns>
        /// <exception cref="HotelSyncException">Throws exception if resync of hotel facilities is failed.</exception>
        List<Item> ResyncFacilities(Dictionary<string, HotelItem> items);

        void UpdateMasterIndexes(Item hotelItem);

        /// <summary>
        /// Downloads source image URLs and uploads them to Amazon S3.
        /// </summary>
        /// <param name="hotelCode">HotelBeds hotel code.</param>
        /// <param name="imageUrlsByField">Image URLs keyed by Sitecore field name (Small, Medium, Large).</param>
        /// <param name="imageName">Image file name to use in S3 keys.</param>
        /// <param name="errorsByField">Errors keyed by field name for failed downloads/uploads.</param>
        /// <param name="s3KeyPrefix">S3 key prefix (for example: "hbg").</param>
        /// <returns>S3 URLs keyed by the same image field names.</returns>
        Dictionary<string, string> SyncImageUrlsToAmazonS3(
            string hotelCode,
            IDictionary<string, string> imageUrlsByField,
            string imageName,
            out Dictionary<string, string> errorsByField,
            string s3KeyPrefix = "hbg");
    }
}
