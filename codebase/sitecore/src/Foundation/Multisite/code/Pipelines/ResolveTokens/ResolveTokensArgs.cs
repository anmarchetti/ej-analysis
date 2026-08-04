using Sitecore.Data.Items;
using Sitecore.Pipelines;

namespace easyJet.Foundation.Multisite.Pipelines.ResolveTokens
{
    public class ResolveTokensArgs : PipelineArgs
    {
        public Item ContextItem { get; set; }

        public string Query { get; set; }

        public ResolveTokensArgs(Item contextItem, string query)
        {
            ContextItem = contextItem;
            Query = query;
        }
    }
}