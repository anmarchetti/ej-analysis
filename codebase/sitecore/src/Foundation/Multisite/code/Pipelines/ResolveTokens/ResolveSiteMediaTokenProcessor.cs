using Sitecore.Data.Items;

namespace easyJet.Foundation.Multisite.Pipelines.ResolveTokens
{
    public class ResolveSiteMediaTokenProcessor : ResolveTokensProcessor
    {
        public ResolveSiteMediaTokenProcessor(IMultiSiteContext multiSiteContext)
            : base(multiSiteContext)
        {
        }

        protected override string Token => "$media";

        protected override Item GetTokenizedItem(Item contextItem)
        {
            return MultiSiteContext.GetSiteMediaItem(contextItem);
        }
    }
}