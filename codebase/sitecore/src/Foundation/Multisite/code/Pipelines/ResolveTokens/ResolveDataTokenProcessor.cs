using Sitecore.Data.Items;

namespace easyJet.Foundation.Multisite.Pipelines.ResolveTokens
{
    public class ResolveDataTokenProcessor : ResolveTokensProcessor
    {
        public ResolveDataTokenProcessor(IMultiSiteContext multiSiteContext)
            : base(multiSiteContext)
        {
        }

        protected override string Token => "$data";

        protected override Item GetTokenizedItem(Item contextItem)
        {
            return MultiSiteContext.GetDataItem(contextItem);
        }
    }
}