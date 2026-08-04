using System;
using easyJet.Foundation.SitecoreExtensions.ContentResolvers;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore.Diagnostics;
using Sitecore.LayoutService.Configuration;
using Sitecore.LayoutService.ItemRendering.ContentsResolvers;
using Sitecore.Mvc.Presentation;

namespace easyJet.Feature.PageContent.ContentResolvers
{
    public class ItemWithChildrenContentResolver : MultiLanguageRenderingResolver, IRenderingContentsResolver
    {
        public override object ResolveContents(Rendering rendering, IRenderingConfiguration renderingConfig)
        {
            try
            {
                var contextItem = GetContextItem(rendering, renderingConfig);

                if (contextItem == null)
                {
                    return null;
                }

                var result = ProcessItem(contextItem, rendering, renderingConfig);
                result.Add("Children", ProcessItems(contextItem.Children.CheckVersion(contextItem), rendering, renderingConfig));

                return result;
            }
            catch (Exception exc)
            {
                Log.Error($"{nameof(ItemWithChildrenContentResolver)} cannot resolve content", exc, this);
                return null;
            }
        }
    }
}