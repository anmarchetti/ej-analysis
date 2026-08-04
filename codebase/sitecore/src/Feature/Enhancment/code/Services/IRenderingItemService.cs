using Sitecore.Data.Items;

namespace easyJet.Feature.SitecoreEnhancment.Services
{
    /// <summary>
    ///     Abstraction over Sitecore rendering items to simplify unit testing.
    /// </summary>
    public interface IRenderingItemService
    {
        string GetItemDisplayName(string itemId);

        string GetRenderingIconUrl(string itemId);

        string GetRenderingComponentName(string itemId);

        string GetRenderingTypeName(string itemId);

        /// <summary>
        ///     Returns the parameters template item for the given rendering item, or null.
        /// </summary>
        Item GetParametersTemplateItem(Item renderingItem);

        /// <summary>
        ///     Returns rendering folders that contain rendering children for a given source path.
        ///     Potentially expensive; use GetSourceItemsFromCache when possible.
        /// </summary>
        Item[] GetSourceItems(string source);

        /// <summary>
        ///     Returns cached rendering folders for a given source path when the cache was populated.
        /// </summary>
        Item[] GetSourceItemsFromCache(string source);

        /// <summary>
        ///     Checks if the item is a Rendering Folder that has Rendering children.
        /// </summary>
        bool IsRenderingFolderWithRenderings(Item item);
    }
}