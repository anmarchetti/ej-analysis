using System;
using Sitecore.Data.Items;
using Sitecore.Links.UrlBuilders;

namespace easyJet.Feature.PageContent.Providers.Arguments
{
    public class LinkProviderArgs
    {
        public Item Item { get; set; }

        public ItemUrlBuilderOptions BuilderOptions { get; set; }

        public bool ApplySiteResolving { get; set; }

        public Func<Item, ItemUrlBuilderOptions, string> BaseCall { get; set; }
    }
}