using System;
using Sitecore.Data.Items;
using Sitecore.Pipelines;

namespace easyJet.Foundation.Destinations.Pipelines.Arguments
{
    public class DestinationPipelineArgs : PipelineArgs
    {
        public Item Parent { get; set; }

        public DateTime LastUpdateTime { get; set; }

        public Item[] Items { get; set; }
    }
}