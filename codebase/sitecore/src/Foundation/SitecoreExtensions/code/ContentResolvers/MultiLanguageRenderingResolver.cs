using System.Collections.Generic;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore.Data.Items;
using Sitecore.LayoutService.Configuration;
using Sitecore.Mvc.Presentation;

namespace easyJet.Foundation.SitecoreExtensions.ContentResolvers
{
    /// <summary>
    /// This rendering content resolver serializes items that have a version in requested context language.
    /// Ex. If the current context is 'fr-FR' and an item has no language version in fr-Fr, this item will not be serialized.
    /// </summary>
    public class MultiLanguageRenderingResolver : RenderingContentsResolver
    {
        protected override Item GetContextItem(Rendering rendering, IRenderingConfiguration renderingConfig)
        {
            var contextItem = base.GetContextItem(rendering, renderingConfig);
            return contextItem.HasVersion() ? contextItem : null;
        }

        protected override IEnumerable<Item> GetItems(Item contextItem)
        {
            var items = base.GetItems(contextItem);
            return items.CheckVersion(contextItem);
        }
    }
}
