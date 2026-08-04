using easyJet.Foundation.Multisite.Logging;
using easyJet.Foundation.SitecoreExtensions.Indexing;
using Sitecore.Pipelines;

namespace easyJet.Foundation.Multisite.Pipelines.RebuildIndex
{
    public class RebuildIndexProcessor
    {
        private readonly IMultisiteLogger logger;
        private readonly IIndexingService indexingService;

        public RebuildIndexProcessor(IMultisiteLogger logger, IIndexingService indexingService)
        {
            this.logger = logger;
            this.indexingService = indexingService;
        }

        /// <summary>
        /// Called on Pipeline execution.
        /// Start full rebuild index by index name if processor inner item template is "Index Rebuild Schedule".
        /// </summary>
        /// <param name="args">Pipeline arguments.</param>
        public void Process(PipelineArgs args)
        {
            string indexName = args.ProcessorItem.InnerItem[Constants.Fields.IndexRebuildSchedule.IndexName];
            if (!string.IsNullOrWhiteSpace(indexName))
            {
                logger.Info($"Started full rebuild of index \"{indexName}\"", this);
                indexingService.FullRebuild(indexName);
            }
            else
            {
                logger.Warn("Index name is empty", this);
            }
        }
    }
}