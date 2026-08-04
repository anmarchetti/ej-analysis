using System.Collections.Generic;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Pipelines.Arguments
{
    public class UploadPipelineArgs<T> : DestinationPipelineArgs
    {
        public Item ContextItem { get; set; }

        public List<T> UploadData { get; set; }

        /// <summary>
        /// Gets or sets processed items.
        /// Needs for getting processed items without triggering auto publish.
        /// </summary>
        public Item[] ProcessedItems { get; set; }
    }
}