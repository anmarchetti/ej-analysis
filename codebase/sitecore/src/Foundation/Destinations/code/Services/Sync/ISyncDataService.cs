using System.Collections.Generic;
using Sitecore.Data;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Services.Sync
{
    public interface ISyncDataService
    {
        /// <summary>
        /// Sync boards.
        /// </summary>
        /// <param name="template">Template id.</param>
        /// <param name="parent">Parent item.</param>
        /// <returns>Collection of synced items.</returns>
        IEnumerable<Item> SyncBoards(ID template, Item parent);
    }
}