using System;
using System.Collections.Generic;
using easyJet.Foundation.SitecoreExtensions.Helper;
using Sitecore.Diagnostics;
using Sitecore.LayoutService.Configuration;
using Sitecore.LayoutService.ItemRendering.ContentsResolvers;
using Sitecore.Mvc.Presentation;
using RenderingContentsResolver = easyJet.Foundation.SitecoreExtensions.ContentResolvers.RenderingContentsResolver;

namespace easyJet.Feature.PageContent.ContentResolvers
{
    public class DatasourceMultilistItemsChildrenResolver : RenderingContentsResolver, IRenderingContentsResolver
    {
        /// <summary>
        /// Resolve children of selected multilist items.
        /// </summary>
        /// <param name="rendering">Sitecore rendering.</param>
        /// <param name="renderingConfig">Rendering configuration.</param>
        /// <returns>Resolved content.</returns>
        public override object ResolveContents(Rendering rendering, IRenderingConfiguration renderingConfig)
        {
            try
            {
                var item = GetContextItem(rendering, renderingConfig);

                if (item == null)
                {
                    return null;
                }

                var result = new Dictionary<string, object>();
                var fields = item.Template.OwnFields;

                foreach (var templateFieldItem in fields)
                {
                    var fieldItem = item.Fields[templateFieldItem.Name];
                    result.Add(templateFieldItem.Name, ItemFieldsHelper.GetFieldValue(fieldItem, true, true));
                }

                return result;
            }
            catch (Exception exc)
            {
                Log.Error($"{nameof(FeaturedHotelsContentResolver)} cannot resolve content", exc, this);
                return null;
            }
        }
    }
}