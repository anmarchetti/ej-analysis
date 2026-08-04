using System.Collections.Generic;
using System.Linq;
using Sitecore.ContentSearch.Pipelines.IndexingFilters;

namespace easyJet.Foundation.Multisite.Pipelines.RebuildIndex
{
    public class PathIndexFilter : InboundIndexFilterProcessor
    {
        public List<string> ExcludeItemPaths { get; set; } = new List<string>();

        public override void Process(InboundIndexFilterArgs args)
        {
            if (ExcludeItemPaths.Any(path => args.IndexableToIndex.AbsolutePath.StartsWith(path)))
            {
                args.IsExcluded = true;
            }
        }
    }
}