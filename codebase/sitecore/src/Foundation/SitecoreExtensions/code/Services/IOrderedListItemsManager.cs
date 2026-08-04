using System.Collections.Generic;
using Sitecore.Data;
using Sitecore.Data.Items;

namespace easyJet.Foundation.SitecoreExtensions.Services
{
    /// <summary>
    /// Items Manager for OrderedList field <see cref="easyJet.Feature.SitecoreEnhancment.Fields.OrderedFields"/>.
    /// </summary>
    public interface IOrderedListItemsManager
    {
        /// <summary>
        /// Get ordered item ids.
        /// </summary>
        /// <param name="fieldValue">Field value.</param>
        /// <param name="source">Field source value.</param>
        /// <param name="item">Item with ordered field.</param>
        /// <returns>Collections of ordered ids values.</returns>
        ID[] GetOrderedItemIds(string fieldValue, string source, Item item);

        /// <summary>
        /// Get ordered items.
        /// </summary>
        /// <param name="item">Item with ordered field.</param>
        /// <param name="fieldName">Ordered List field name.</param>
        /// <returns>Collections of ordered items values.</returns>
        List<Item> GetOrderedItems(Item item, string fieldName);
    }
}
