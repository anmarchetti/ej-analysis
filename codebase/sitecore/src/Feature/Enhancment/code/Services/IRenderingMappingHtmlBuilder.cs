using System.Collections.Generic;
using Sitecore.Data;
using Sitecore.Data.Items;

namespace easyJet.Feature.SitecoreEnhancment.Services
{
    /// <summary>
    /// Service for building HTML components used in the RenderingMappingEditor field.
    /// </summary>
    public interface IRenderingMappingHtmlBuilder
    {
        /// <summary>
        /// Builds the header HTML for the rendering mapping editor.
        /// </summary>
        /// <param name="labelKey">Label for the key column.</param>
        /// <param name="labelValue">Label for the value column.</param>
        /// <param name="labelUid">Label for the rendering instance UID column.</param>
        /// <returns>HTML string for the header.</returns>
        string BuildHeaderHtml(string labelKey, string labelValue, string labelUid);

        /// <summary>
        /// Builds the complete row context from rendering data.
        /// </summary>
        /// <param name="rowId">Unique row identifier.</param>
        /// <param name="parameters">Parameters string.</param>
        /// <param name="clientEvent">Client-side event handler.</param>
        /// <param name="keyConfig">Key column configuration (rendering ID, source, optional ID filter).</param>
        /// <param name="valueConfig">Value column configuration (rendering ID, source, optional ID filter).</param>
        /// <returns>Populated row context.</returns>
        RenderingMappingRowContext BuildRowContext(
            string rowId,
            string parameters,
            string clientEvent,
            RenderingColumnConfig keyConfig,
            RenderingColumnConfig valueConfig);

        /// <summary>
        /// Builds the HTML for a single mapping row.
        /// </summary>
        /// <param name="context">Context containing all data needed to build the row.</param>
        /// <returns>HTML string for the row.</returns>
        string BuildRowHtml(RenderingMappingRowContext context);

        /// <summary>
        /// Builds a grouped dropdown HTML with rendering items.
        /// </summary>
        /// <param name="controlId">ID for the dropdown control.</param>
        /// <param name="selectedValue">Currently selected value.</param>
        /// <param name="sourceItems">Source items for populating the dropdown.</param>
        /// <param name="allowedRenderingIds">Optional set of rendering IDs to include; <c>null</c> means show all.</param>
        /// <param name="addJustRemoveOption">When <c>true</c>, prepends a "Just Remove" option before the groups.</param>
        /// <returns>HTML string for the dropdown.</returns>
        string BuildGroupedDropdownHtml(string controlId, string selectedValue, IEnumerable<Item> sourceItems, HashSet<ID> allowedRenderingIds = null, bool addJustRemoveOption = false);

        /// <summary>
        /// Builds display HTML for a rendering item (icon + name).
        /// </summary>
        /// <param name="itemId">ID of the rendering item.</param>
        /// <param name="displayName">Display name of the rendering.</param>
        /// <returns>HTML string for the rendering display.</returns>
        string BuildRenderingDisplayHtml(string itemId, string displayName);
    }
}
