using Sitecore.Data.Items;
using Sitecore.Pipelines;

namespace easyJet.Feature.PageContent.Pipelines.ItemResolving
{
    public class CreateResolveItemResultArgs : PipelineArgs
    {
        public CreateResolveItemResultArgs(Item item, ResolveItemSettings settings)
        {
            Item = item;
            Settings = settings;
        }

        public ResolveItemSettings Settings { get; set; }

        public Item Item { get; private set; }

        public ResolveItemResult Result { get; set; }
    }
}