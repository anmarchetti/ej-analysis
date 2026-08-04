using Sitecore.Data.Items;

namespace easyJet.Foundation.Multisite.Pipelines.ResolveTokens
{
    public class ResolveHomeTokenProcessor : ResolveTokensProcessor
    {
        public ResolveHomeTokenProcessor(IMultiSiteContext multiSiteContext)
            : base(multiSiteContext)
        {
        }

        protected override string Token => "$home";

        protected override Item GetTokenizedItem(Item contextItem)
        {
            return MultiSiteContext.GetHomeItem(contextItem);
        }
    }
}