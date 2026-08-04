using System.Collections.Generic;
using Sitecore.Pipelines;

namespace easyJet.Foundation.AmazonS3.Pipelines.Arguments
{
    public class BatchSyncPipelineArgs : PipelineArgs
    {
        public List<ImagePipelineArgs> Batch { get; set; }
    }
}