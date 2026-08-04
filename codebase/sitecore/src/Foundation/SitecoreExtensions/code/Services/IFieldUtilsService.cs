using Sitecore.Data;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;

namespace easyJet.Foundation.SitecoreExtensions.Services
{
    /// <summary>
    /// Abstraction for Sitecore field utilities to enable testing and dependency injection.
    /// </summary>
    public interface IFieldUtilsService
    {
        /// <summary>
        /// Gets the effective layout field value, walking up to __Standard Values when the item
        /// itself has no own value. Wraps <see cref="Sitecore.Data.Fields.LayoutField.GetFieldValue"/>.
        /// </summary>
        /// <param name="field">The layout or final-layout field.</param>
        /// <returns>The XML string of the layout definition, or empty if none.</returns>
        string GetLayoutFieldValue(Field field);

        /// <summary>
        /// Gets multilist target IDs from a field identified by field ID.
        /// </summary>
        /// <param name="fieldId">The ID of the multilist field.</param>
        /// <param name="item">The item containing the field.</param>
        /// <returns>Array of target item IDs, or empty array if field not found or empty.</returns>
        ID[] GetMultilistTargetIds(ID fieldId, Item item);

        ID[] GetMultilistTargetIds(string fieldName, Item item);

        /// <summary>
        /// Gets multilist target items from a field identified by field ID.
        /// </summary>
        /// <param name="fieldId">The ID of the multilist field.</param>
        /// <param name="item">The item containing the field.</param>
        /// <returns>Array of target items, or empty array if field not found or empty.</returns>
        Item[] GetMultilistTargetItems(ID fieldId, Item item);

        Item[] GetMultilistTargetItems(string fieldName, Item item);
    }
}
