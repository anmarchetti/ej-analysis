using System.Collections.Generic;
using Sitecore.Data;
using Sitecore.Data.Items;

namespace easyJet.Feature.SitecoreEnhancment.Services
{
    /// <summary>
    /// Abstraction for Sitecore template operations to improve testability.
    /// </summary>
    public interface ITemplateService
    {
        /// <summary>
        /// Gets all non-system field names from a template item.
        /// </summary>
        /// <param name="templateItem">The template item to extract field names from.</param>
        /// <returns>Collection of field names excluding system fields (those starting with __).</returns>
        IEnumerable<string> GetFieldNames(Item templateItem);

        /// <summary>
        /// Gets a dictionary mapping field IDs to field names for a template.
        /// </summary>
        /// <param name="templateItem">The template item.</param>
        /// <returns>Dictionary of field ID to field name mappings.</returns>
        IDictionary<ID, string> GetFieldIdToNameMap(Item templateItem);

        /// <summary>
        /// Gets the standard values item for a template.
        /// </summary>
        /// <param name="templateItem">The template item.</param>
        /// <returns>The standard values item, or null if not available.</returns>
        Item GetStandardValuesItem(Item templateItem);

        /// <summary>
        /// Builds field descriptors from a template for the field editor.
        /// </summary>
        /// <param name="templateItem">The template item.</param>
        /// <param name="parsedParams">Current parameter values.</param>
        /// <param name="addedFields">Set of already added field names to avoid duplicates.</param>
        /// <returns>Collection of field descriptors.</returns>
        IEnumerable<FieldDescriptorInfo> BuildFieldDescriptors(
            Item templateItem,
            System.Collections.Specialized.NameValueCollection parsedParams,
            HashSet<string> addedFields);
    }
}
