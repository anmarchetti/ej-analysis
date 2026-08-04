using Sitecore.ContentSearch;
using Sitecore.ContentSearch.Pipelines.IndexingFilters;

namespace easyJet.Foundation.Destinations.Pipelines.IndexingFilterIndexInbound
{
    public class ApplyInboundIndexVersionFilter : InboundIndexFilterProcessor
    {
        public override void Process(InboundIndexFilterArgs args)
        {
            if (args.IndexableToIndex is SitecoreIndexableItem item && !item.Item.Versions.IsLatestVersion())
            {
                args.IsExcluded = true;
            }
        }
    }
}