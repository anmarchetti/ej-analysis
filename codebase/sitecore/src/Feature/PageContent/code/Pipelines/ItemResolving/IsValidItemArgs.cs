using Sitecore.Data.Items;
using Sitecore.Pipelines;

namespace easyJet.Feature.PageContent.Pipelines.ItemResolving
{
    public class IsValidItemArgs : PipelineArgs
    {
        public IsValidItemArgs(Item item, ResolveItemSettings settings)
        {
            Item = item;
            Settings = settings;
        }

        public ResolveItemSettings Settings { get; set; }

        public Item Item { get; private set; }

        public bool Result { get; set; }
    }
}