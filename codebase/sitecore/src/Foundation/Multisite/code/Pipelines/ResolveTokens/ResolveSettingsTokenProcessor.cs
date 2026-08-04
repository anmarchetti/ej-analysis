using Sitecore.Data.Items;

namespace easyJet.Foundation.Multisite.Pipelines.ResolveTokens
{
    public class ResolveSettingsTokenProcessor : ResolveTokensProcessor
    {
        public ResolveSettingsTokenProcessor(IMultiSiteContext multiSiteContext)
            : base(multiSiteContext)
        {
        }

        protected override string Token => "$settings";

        protected override Item GetTokenizedItem(Item contextItem)
        {
            return MultiSiteContext.GetSettingsItem(contextItem);
        }
    }
}