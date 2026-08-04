using Sitecore.Data.Items;
using Sitecore.Diagnostics;

namespace easyJet.Foundation.Multisite.Pipelines.ResolveTokens
{
    public abstract class ResolveTokensProcessor
    {
        protected abstract string Token { get; }

        protected IMultiSiteContext MultiSiteContext { get; set; }

        protected ResolveTokensProcessor(IMultiSiteContext multiSiteContext)
        {
            MultiSiteContext = multiSiteContext;
        }

        public void Process(ResolveTokensArgs args)
        {
            Assert.ArgumentNotNull(args, nameof(args));

            if (args.Query.Contains(Token))
            {
                var item = GetTokenizedItem(args.ContextItem);

                args.Query = item != null
                    ? args.Query.Replace(Token, item.Paths.Path)
                    : args.Query.Replace(Token, string.Empty);
            }
        }

        protected abstract Item GetTokenizedItem(Item contextItem);
    }
}