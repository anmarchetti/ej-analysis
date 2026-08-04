using System.Collections.Generic;
using System.Linq;
using Sitecore.Data;
using Sitecore.Data.Items;

namespace easyJet.Foundation.HotelBeds.Services.Sync
{
    /// <summary>
    /// Clears Sitecore data and item cache entries for specific items (no subtree walk).
    /// </summary>
    public static class CacheHelper
    {
        public static void ClearCaches(Item item)
        {
            if (item?.Database == null || item.ID.IsNull)
            {
                return;
            }

            ClearCaches(item.Database, new[] { item.ID });
        }

        public static void ClearCaches(Database database, IEnumerable<ID> itemIds)
        {
            if (database?.Caches == null || itemIds == null || !itemIds.Any())
            {
                return;
            }

            var dataCache = database.Caches.DataCache;
            var itemCache = database.Caches.ItemCache;
            if (dataCache == null || itemCache == null)
            {
                return;
            }

            foreach (var id in itemIds)
            {
                if (id.IsNull)
                {
                    continue;
                }

                dataCache.RemoveItemInformation(id);
                itemCache.RemoveItem(id);
            }
        }
    }
}
