using System.Collections.Generic;
using Sitecore.Data;

namespace easyJet.Feature.SitecoreEnhancment.Services
{
    /// <summary>
    /// Groups the rendering column configuration for a single column (key or value)
    /// in the RenderingMappingEditor. Introduced to keep
    /// <see cref="IRenderingMappingHtmlBuilder.BuildRowContext"/> within the authorised
    /// parameter count.
    /// </summary>
    public sealed class RenderingColumnConfig
    {
        /// <summary>
        /// The ID of the rendering item selected in this column.
        /// </summary>
        public string RenderingId { get; }

        /// <summary>
        /// The data-source path used to populate the dropdown for this column.
        /// </summary>
        public string Source { get; }

        /// <summary>
        /// Optional set of rendering IDs that are allowed in this column's dropdown.
        /// When <c>null</c>, all renderings from <see cref="Source"/> are shown.
        /// </summary>
        public HashSet<ID> AllowedRenderingIds { get; }

        /// <summary>
        /// When <c>true</c>, a "Just Remove" option is prepended to the dropdown
        /// before any rendering groups. Only meaningful for the value column.
        /// </summary>
        public bool AddJustRemoveOption { get; }

        public RenderingColumnConfig(string renderingId, string source, HashSet<ID> allowedRenderingIds = null, bool addJustRemoveOption = false)
        {
            RenderingId = renderingId;
            Source = source;
            AllowedRenderingIds = allowedRenderingIds;
            AddJustRemoveOption = addJustRemoveOption;
        }
    }
}
