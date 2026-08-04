using System.Collections.Generic;
using Sitecore.Data;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Repositories
{
    /// <summary>
    /// Represents DatasourceRepository based on Search.
    /// </summary>
    public interface ISearchDatasourceRepository
    {
        /// <summary>
        /// Tries to get Item by code using search
        /// Returns found item or creates new one.
        /// </summary>
        /// <param name="name">Item's name.</param>
        /// <param name="code">Item's code.</param>
        /// <param name="templateId">Item's template ID.</param>
        /// <param name="parent">Item's parent.</param>
        /// <param name="disableEvents">Determinates should events be disabled or not.</param>
        /// <returns>Item's object.</returns>
        Item GetOrCreateItem(string name, string code, ID templateId, Item parent, out bool itemCreated, bool disableEvents = false);

        /// <summary>
        /// Gets item by provided template ID and code.
        /// </summary>
        /// <param name="code">Hotel Beds/Atcom code.</param>
        /// <param name="templateId">Templete ID.</param>
        /// <param name="shouldGetFirstVersion">Indicates if should get first or last version of item.</param>
        /// <returns>Sitecore's Item.</returns>
        Item GetItemByCode(string code, ID templateId, bool shouldGetFirstVersion = true);

        /// <summary>
        /// Gets items by provided template ID and codes.
        /// </summary>
        /// <param name="codes">Hotel Beds/Atcom codes.</param>
        /// <param name="templateId">Templete ID.</param>
        /// <returns>Dictionary of found items where Key is code, Value is Item object.</returns>
        Dictionary<string, Item> GetItemsByCodes(List<string> codes, ID templateId);

        /// <summary>
        /// Gets items by provided template ID and codes.
        /// </summary>
        /// <param name="codes">Hotel Beds/Atcom codes.</param>
        /// <param name="templateId">Templete ID.</param>
        /// <returns>Enumerable of found items.</returns>
        IEnumerable<Item> GetAllItemsByCodes(List<string> codes, ID templateId);

        /// <summary>
        /// Gets items by provided template ID.
        /// </summary>
        /// <param name="templateId">Templete ID.</param>
        /// <returns>Dictionary of found items where Key is code, Value is Item object.</returns>
        Dictionary<string, Item> GetItemsByTemplate(ID templateId);

        /// <summary>
        /// Gets Item IDs by provided template ID and codes.
        /// </summary>
        /// <param name="codes">Atcom codes.</param>
        /// <param name="templateId">Template ID.</param>
        /// <returns>Dictionary of found items where Key is code, Value is ItemId.</returns>
        Dictionary<string, ID> GetItemIdsByCodes(List<string> codes, ID templateId);
    }
}