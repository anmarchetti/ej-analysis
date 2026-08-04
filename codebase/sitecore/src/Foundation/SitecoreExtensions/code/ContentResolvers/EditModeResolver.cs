using System.Linq;
using Newtonsoft.Json.Linq;
using Sitecore.Diagnostics;
using Sitecore.LayoutService.Configuration;
using Sitecore.LayoutService.ItemRendering.ContentsResolvers;
using Sitecore.Mvc.Presentation;

namespace easyJet.Foundation.SitecoreExtensions.ContentResolvers
{
    public class EditModeResolver : RenderingContentsResolver, IRenderingContentsResolver
    {
        /// <summary>
        /// Serialize items provided by query and adds parent ID of first retrived child.
        /// {
        ///     Id = [ParentId],
        ///     Items = [Items By Query]
        /// }.
        /// </summary>
        /// <param name="rendering">Rendering object.</param>
        /// <param name="renderingConfig">Rendering Configuration.</param>
        /// <returns>Serialized data or null if IsNormal mode.</returns>
        public override object ResolveContents(Rendering rendering, IRenderingConfiguration renderingConfig)
        {
            // Should NOT return any data in Normal mode
            if (Sitecore.Context.PageMode.IsNormal)
            {
                return null;
            }

            Assert.ArgumentNotNull(rendering, nameof(rendering));
            Assert.ArgumentNotNull(renderingConfig, nameof(renderingConfig));

            var contextItem = GetContextItem(rendering, renderingConfig);
            if (contextItem == null)
            {
                return null;
            }

            if (string.IsNullOrWhiteSpace(ItemSelectorQuery))
            {
                return ProcessItem(contextItem, rendering, renderingConfig);
            }

            var items = GetItems(contextItem)?.ToList();
            if (items == null || items.Count <= 0)
            {
                return new JArray();
            }

            // Assume that all items will have same type - therefore taking parent ID of first one
            var parentId = items.First().ParentID;

            return new
            {
                Id = parentId,
                Items = ProcessItems(items, rendering, renderingConfig)
            };
        }
    }
}