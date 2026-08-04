using Sitecore.Data.Items;
using Sitecore.Pipelines;

namespace easyJet.Foundation.AmazonS3.Pipelines.Arguments
{
    public class ImagePipelineArgs : PipelineArgs
    {
        public MediaItem ImageItem { get; set; }

        public string HotelCode { get; set; }

        public string ItemCode { get; set; }

        public bool KeepOriginal { get; set; }
    }
}