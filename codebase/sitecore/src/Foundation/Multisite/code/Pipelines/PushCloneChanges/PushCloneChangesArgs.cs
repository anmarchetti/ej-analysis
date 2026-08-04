using Sitecore.Data.Items;
using Sitecore.Pipelines;

namespace easyJet.Foundation.Multisite.Pipelines.PushCloneChanges
{
    public class PushCloneChangesArgs : PipelineArgs
    {
        public ItemChanges Changes { get; set; }

        public Item Item { get; set; }

        public Item Clone { get; set; }
    }
}