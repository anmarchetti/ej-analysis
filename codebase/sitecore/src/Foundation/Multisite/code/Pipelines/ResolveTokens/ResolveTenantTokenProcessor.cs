using Sitecore.Data.Items;

namespace easyJet.Foundation.Multisite.Pipelines.ResolveTokens
{
    public class ResolveTenantTokenProcessor : ResolveTokensProcessor
    {
        public ResolveTenantTokenProcessor(IMultiSiteContext multiSiteContext)
            : base(multiSiteContext)
        {
        }

        protected override string Token => "$tenant";

        protected override Item GetTokenizedItem(Item contextItem)
        {
            return MultiSiteContext.GetTenantItem(contextItem);
        }
    }
}