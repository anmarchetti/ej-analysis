using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.SitecoreExtensions.ContentResolvers;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;

namespace easyJet.Feature.PageContent.ContentResolvers
{
    public class DatasourceSelectedItemsContentResolver : RenderingContentsResolver
    {
        protected override IEnumerable<Item> GetItems(Item contextItem)
        {
            MultilistField multilistField = contextItem.Fields["Items"];

            if (multilistField == null)
            {
                return Enumerable.Empty<Item>();
            }

            return multilistField.GetItems().CheckVersion(contextItem);
        }
    }
}