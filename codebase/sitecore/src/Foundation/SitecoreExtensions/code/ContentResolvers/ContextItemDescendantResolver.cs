using System.Collections.Generic;
using Newtonsoft.Json.Linq;
using Sitecore.Data.Items;
using Sitecore.LayoutService.Configuration;
using Sitecore.LayoutService.ItemRendering.ContentsResolvers;
using Sitecore.Mvc.Presentation;

namespace easyJet.Foundation.SitecoreExtensions.ContentResolvers
{
    public class ContextItemDescendantResolver : RenderingContentsResolver
    {
        protected override JArray ProcessItems(IEnumerable<Item> items, Rendering rendering, IRenderingConfiguration renderingConfig)
        {
            JArray jarray = new JArray();
            foreach (Item item in items)
            {
                JObject jobject1 = ProcessItem(item, rendering, renderingConfig);
                JObject jobject2 = new JObject()
                {
                    ["id"] = item.ID.Guid.ToString(),
                    ["name"] = item.Name,
                    ["displayName"] = item.DisplayName,
                    ["fields"] = jobject1,
                    ["children"] = ProcessItems(item.Children.ToArray(), rendering, renderingConfig),
                };
                jarray.Add(jobject2);
            }

            return jarray;
        }
    }
}