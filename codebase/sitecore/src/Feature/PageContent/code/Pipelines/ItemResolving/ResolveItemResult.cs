using Sitecore.Data.Items;

namespace easyJet.Feature.PageContent.Pipelines.ItemResolving
{
    public class ResolveItemResult
    {
        public static ResolveItemResult NoItemFound => new ResolveItemResult(null);

        public ResolveItemResult(Item item)
            : this(item, item)
        {
        }

        public ResolveItemResult(Item item, Item urlPathContextItem)
        {
            Item = item;
            UrlPathContextItem = urlPathContextItem;
        }

        public Item Item { get; private set; }

        public Item UrlPathContextItem { get; private set; }
    }
}
