using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.SitecoreExtensions.ContentResolvers;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore.Data.Items;
using Sitecore.Diagnostics;

namespace easyJet.Feature.PageContent.ContentResolvers
{
    public class ItemWithChildrenVersionCheckContentResolver : RenderingContentsResolver
    {
        protected override IEnumerable<Item> GetItems(Item contextItem)
        {
            Assert.ArgumentNotNull((object)contextItem, nameof(contextItem));
            var items = string.IsNullOrWhiteSpace(ItemSelectorQuery) ? Enumerable.Empty<Item>() : (IEnumerable<Item>)contextItem.Axes.SelectItems(ItemSelectorQuery);
            return items.CheckVersion(contextItem);
        }
    }
}