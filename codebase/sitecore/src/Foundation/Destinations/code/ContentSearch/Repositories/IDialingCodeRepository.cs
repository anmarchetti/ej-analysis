using System.Collections.Generic;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.ContentSearch.Repositories
{
    public interface IDialingCodeRepository
    {
        /// <summary>
        /// Get all dialing code items from Sitecore.
        /// </summary>
        /// <returns>Collection of items.</returns>
        IEnumerable<Item> GetAllDialingCodeItems();
    }
}
