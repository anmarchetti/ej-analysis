using System;
using System.Linq;
using easyJet.Feature.PageContent.Models;
using easyJet.Feature.PageContent.Utils;
using easyJet.Foundation.SitecoreExtensions.Models;
using Newtonsoft.Json.Linq;
using Sitecore.Abstractions;
using Sitecore.Data.Fields;
using Sitecore.Diagnostics;
using Sitecore.LayoutService.Configuration;
using Sitecore.LayoutService.ItemRendering.ContentsResolvers;
using Sitecore.Mvc.Presentation;
using RenderingContentsResolver = easyJet.Foundation.SitecoreExtensions.ContentResolvers.RenderingContentsResolver;

namespace easyJet.Feature.PageContent.ContentResolvers
{
    public class DealsLinksContentResolver : RenderingContentsResolver, IRenderingContentsResolver
    {
        private BaseLinkManager LinkManager { get; }

        public DealsLinksContentResolver(BaseLinkManager linkManager)
        {
            LinkManager = linkManager;
        }

        /// <summary>
        /// Resolve content for Deals Links component.
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

                JObject result = new JObject()
                {
                    ["Title"] = SitecoreFieldUtils.BuildSitecoreField(item[Constants.Fields.DealsLinks.Title]),
                    ["Subtitle"] = SitecoreFieldUtils.BuildSitecoreField(item[Constants.Fields.DealsLinks.Subtitle]),
                    ["Icon"] = SitecoreFieldUtils.BuildSitecoreField(new Image(item.Fields[Constants.Fields.DealsLinks.Icon], ImageSize.Large))
                };

                result["Pages"] = JArray.FromObject(((MultilistField)item.Fields[Constants.Fields.DealsLinks.Pages])
                    .GetItems()
                    .Select(x => new
                    {
                        Id = x.ID,
                        Url = LinkManager.GetItemUrl(x),
                        Name = x[Foundation.Destinations.Constants.Fields.DatasourceItem.Name],
                    }));

                return result;
            }
            catch (Exception exc)
            {
                Log.Error($"{nameof(DealsLinksContentResolver)} cannot resolve content", exc, this);
                return null;
            }
        }
    }
}