using System.Collections.Generic;
using Sitecore.Data;
using Sitecore.Data.Items;

namespace easyJet.Feature.SitecoreEnhancment.Services
{
    /// <summary>
    ///     Extracts rendering IDs from Sitecore item layout fields.
    ///     Reads both the shared layout and the final layout field, using
    ///     <see cref="Sitecore.Layouts.LayoutField.GetFieldValue"/> so that
    ///     renderings defined on a template's __Standard Values are included
    ///     even when the item itself stores no own layout XML.
    /// </summary>
    public interface IRenderingIdExtractionService
    {
        /// <summary>
        ///     Returns all rendering IDs found across the page item, its template's __Standard Values,
        ///     and all PageDesign / PartialDesign items matching the page's template.
        ///     Returns an empty set when the item is not found.
        /// </summary>
        HashSet<ID> ExtractFromItemId(ID itemId);

        /// <summary>
        ///     Returns all rendering IDs found across the template's __Standard Values
        ///     and all PageDesign / PartialDesign items matching the template.
        ///     Returns an empty set when the template is not found.
        /// </summary>
        HashSet<ID> ExtractFromTemplateId(ID templateId);

        /// <summary>
        ///     Returns all items whose layout XML should be scanned when building the rendering-instance
        ///     list for a given page item: the page itself, its template's __Standard Values, and all
        ///     PageDesign / PartialDesign items whose page design applies to the page's template.
        /// </summary>
        IReadOnlyList<Item> GetItemsForPageId(ID pageItemId);

        /// <summary>
        ///     Returns all items whose layout XML should be scanned when building the rendering-instance
        ///     list for a given template: the template's __Standard Values, all content items of that
        ///     template, and all PageDesign / PartialDesign items whose page design references the template.
        /// </summary>
        IReadOnlyList<Item> GetItemsForTemplateId(ID templateItemId);

        /// <summary>
        ///     Resolves the items to scan for layout XML from an ECP rule item.
        ///     Reads the <c>Page</c> field first; if set, delegates to <see cref="GetItemsForPageId"/>.
        ///     Otherwise reads the <c>PageTemplate</c> field and delegates to <see cref="GetItemsForTemplateId"/>.
        ///     Returns an empty list when neither field contains a valid ID.
        /// </summary>
        IReadOnlyList<Item> GetItemsForEcpRuleItem(Item ecpRuleItem);
    }
}
