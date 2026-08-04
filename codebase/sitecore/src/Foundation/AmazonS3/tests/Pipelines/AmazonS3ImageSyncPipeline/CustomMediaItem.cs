using Sitecore.Data.Items;

namespace easyJet.Foundation.AmazonS3.Tests.Pipelines.AmazonS3ImageSyncPipeline
{
    internal class CustomMediaItem : MediaItem
    {
        public CustomMediaItem(Item item)
            : base(item)
        {
        }

        public override bool HasMediaStream(string fieldname)
        {
            return true;
        }
    }
}
