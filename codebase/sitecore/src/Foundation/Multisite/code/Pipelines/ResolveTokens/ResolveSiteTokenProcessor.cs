using Sitecore.Data.Items;

namespace easyJet.Foundation.Multisite.Pipelines.ResolveTokens
{
    public class ResolveSiteTokenProcessor : ResolveTokensProcessor
    {
        public ResolveSiteTokenProcessor(IMultiSiteContext multiSiteContext)
            : base(multiSiteContext)
        {
        }

        protected override string Token => "$site";

        protected override Item GetTokenizedItem(Item contextItem)
        {
            return MultiSiteContext.GetSiteItem(contextItem);
        }
    }
}