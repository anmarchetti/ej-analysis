using System.Collections.Generic;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Newtonsoft.Json.Linq;
using Sitecore.Data.Items;
using Sitecore.LayoutService.Configuration;
using Sitecore.LayoutService.Helpers;
using Sitecore.Links;
using Sitecore.Mvc.Presentation;

namespace easyJet.Foundation.SitecoreExtensions.ContentResolvers
{
    public class RenderingContentsResolver : Sitecore.LayoutService.ItemRendering.ContentsResolvers.RenderingContentsResolver
    {
        protected override JArray ProcessItems(IEnumerable<Item> items, Rendering rendering, IRenderingConfiguration renderingConfig)
        {
            var data = new JArray();
            foreach (var item in items)
            {
                var fields = ProcessItem(item, rendering, renderingConfig);
                var content = new JObject
                {
                    ["id"] = (JToken)item.ID.Guid.ToString(),
                    ["name"] = (JToken)item.Name,
                    ["displayName"] = (JToken)item.DisplayName,
                    ["fields"] = fields
                };

                if (item.HasBaseTemplate(Constants.TemplateIds.BasePageTemplate))
                {
                    content["url"] = (JToken)LinkManager.GetItemUrl(item, ItemUrlHelper.GetLayoutServiceUrlOptions());
                }

                data.Add(content);
            }

            return data;
        }
    }
}
