using System;
using Newtonsoft.Json.Linq;
using Sitecore.Diagnostics;
using Sitecore.LayoutService.Configuration;
using Sitecore.LayoutService.ItemRendering.ContentsResolvers;
using Sitecore.Mvc.Presentation;
using RenderingContentsResolver = easyJet.Foundation.SitecoreExtensions.ContentResolvers.RenderingContentsResolver;

namespace easyJet.Feature.PageContent.ContentResolvers
{
    public class ContextItemAllChildrenResolver : RenderingContentsResolver, IRenderingContentsResolver
    {
        public override object ResolveContents(Rendering rendering, IRenderingConfiguration renderingConfig)
        {
            try
            {
                var item = GetContextItem(rendering, renderingConfig);

                if (item == null)
                {
                    return null;
                }

                var result = new JObject { { "items", ProcessItems(item.Children, rendering, renderingConfig) } };
                return result;
            }
            catch (Exception exc)
            {
                Log.Error($"{nameof(ContextItemAllChildrenResolver)} cannot resolve content", exc, this);
                return null;
            }
        }
    }
}