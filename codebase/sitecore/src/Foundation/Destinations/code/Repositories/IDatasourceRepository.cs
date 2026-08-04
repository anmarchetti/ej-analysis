using System.Collections.Generic;
using Sitecore.Data;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Repositories
{
    public interface IDatasourceRepository
    {
        /// <summary>
        /// Get or create sitecore item.
        /// </summary>
        /// <param name="name">Item name.</param>
        /// <param name="templateId">Template id.</param>
        /// <param name="parent">Parent item.</param>
        /// <param name="disableEvents">Flag for disabling events.</param>
        /// <returns>Sitecore item.</returns>
        Item GetOrCreateItem(string name, ID templateId, Item parent, bool disableEvents = false);

        /// <summary>
        /// Get or create sitecore item by code field.
        /// </summary>
        /// <param name="name">Item name.</param>
        /// <param name="code">Code.</param>
        /// <param name="templateId">Template id.</param>
        /// <param name="parent">Parent item.</param>
        /// <param name="disableEvents">Flag for disabling events.</param>
        /// <param name="shouldDoDeepSearch">Flag for deep search.</param>
        /// <param name="version">Item version.</param>
        /// <returns>Sitecore item.</returns>
        Item GetOrCreateItemByCode(string name, string code, ID templateId, Item parent, bool disableEvents = false, bool shouldDoDeepSearch = false, Version version = null);

        /// <summary>
        /// Create sitecore item.
        /// </summary>
        /// <param name="name">Item name.</param>
        /// <param name="templateId">Template id.</param>
        /// <param name="parent">Parent item.</param>
        /// <param name="disableEvents">Flag for disabling events.</param>
        /// <returns>Created sitecore item.</returns>
        Item CreateItem(string name, ID templateId, Item parent, bool disableEvents = false);

        /// <summary>
        /// Create type's item in types folder. Or return existing item.
        /// </summary>
        /// <param name="parentItem">Folder item where item's types are located.</param>
        /// <param name="itemName">Item name.</param>
        /// <param name="templateId">Template Id of item type.</param>
        /// <param name="codeFieldValue">Code field value.</param>
        /// <param name="nameFieldValue">Name field value.</param>
        /// <returns>Created type's item.</returns>
        Item GetOrCreateTypeItem(Item parentItem, string itemName, ID templateId, string codeFieldValue, string nameFieldValue);

        /// <summary>
        /// Create type's item in types folder.
        /// </summary>
        /// <param name="parentItem">Folder item where item's types are located.</param>
        /// <param name="itemName">Item name.</param>
        /// <param name="templateId">Template Id of item type.</param>
        /// <param name="codeFieldValue">Code field value.</param>
        /// <param name="nameFieldValue">Name field value.</param>
        /// <returns>Created type's item.</returns>
        Item CreateTypeItem(Item parentItem, string itemName, ID templateId, string codeFieldValue, string nameFieldValue);

        /// <summary>
        /// Create mapper which maps type codes (code of type is item's field which value is type's code) to item ids.
        /// </summary>
        /// <param name="typesFolderItem">Folder item where item's types are located.</param>
        /// <param name="templateId">Template name of item's type.</param>
        /// <param name="shouldDeepSelect">Mark to do deep select.</param>
        /// <returns>Type codes -> type ids mapper.</returns>
        IDictionary<string, string> CreateMapperWhichMapsTypeCodesToItemIds(Item typesFolderItem, ID templateId, bool shouldDeepSelect = false);

        // GetTypeItemCodesTypeItemIdsMapper

        /// <summary>
        /// Get or Create folder item.
        /// </summary>
        /// <param name="parentItem">Parent item.</param>
        /// <param name="name">Item's name.</param>
        /// <param name="templateId">Template id.</param>
        /// <returns>Folder item.</returns>
        Item GetOrCreateFolderItem(Item parentItem, string name, ID templateId);

        /// <summary>
        /// Create sitecore hotel item from Branch Template.
        /// Set Promotion Blocks folder as a datasource for Promotion Blocks.
        /// If Item does already exist, the existing one will be used.
        /// </summary>
        /// <param name="name">Item name.</param>
        /// <param name="parent">Parent item.</param>
        /// <param name="branch">Item's branch template.</param>
        /// <param name="displayName">Item display name.</param>
        /// <param name="lockItem">Flag that determines whether the item should be locked when its workflow is started.</param>
        /// <returns>Sitecore item.</returns>
        Item GetOrCreateFromHotelBranchTemplate(string name, Item parent, BranchItem branch, string displayName = null, bool lockItem = true);

        /// <summary>
        /// Create sitecore hotel item from Branch Template.
        /// Set Promotion Blocks folder as a datasource for Promotion Blocks.
        /// </summary>
        /// <param name="name">Item name.</param>
        /// <param name="parent">Parent item.</param>
        /// <param name="branch">Item's branch template.</param>
        /// <param name="displayName">Item display name.</param>
        /// <param name="lockItem">Flag that determines whether the item should be locked when its workflow is started.</param>
        /// <returns>Sitecore item.</returns>
        Item CreateFromHotelBranchTemplate(string name, Item parent, BranchItem branch, string displayName = null, bool lockItem = true);

        /// <summary>
        /// Get Branch Template.
        /// </summary>
        /// <param name="path">Brach template path.</param>
        /// <returns>Sitecore item.</returns>
        BranchItem GetBranchTemplate(string path);
    }
}