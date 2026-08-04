using System.Collections.Generic;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.ContentSearch.Repositories
{
    public interface IUserCountryRepository
    {
        /// <summary>
        /// Get all user country items.
        /// </summary>
        /// <returns>Items collection.</returns>
        IEnumerable<Item> GetAllUserCountryItems();
    }
}
