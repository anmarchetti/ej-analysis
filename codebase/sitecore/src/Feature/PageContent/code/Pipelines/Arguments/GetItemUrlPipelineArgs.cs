using Sitecore.Data.Items;
using Sitecore.Links.UrlBuilders;
using Sitecore.Pipelines;

namespace easyJet.Feature.PageContent.Pipelines.Arguments
{
    public class GetItemUrlPipelineArgs : PipelineArgs
    {
        public Item Item { get; set; }

        public ItemUrlBuilderOptions Options { get; set; }

        public string Url { get; set; }
    }
}