using easyJet.Foundation.Multisite.Pipelines.ResolveTokens;
using Sitecore.Data.Items;
using Sitecore.Diagnostics;
using Sitecore.Pipelines;

namespace easyJet.Foundation.Multisite
{
    public static class TokenResolver
    {
        private const string ResolveTokensPipeline = "resolveTokens";

        public static string Resolve(Item contextItem, string query)
        {
            Assert.IsNotNull(contextItem, nameof(contextItem));
            Assert.IsNotNullOrEmpty(query, nameof(query));

            var resolveTokensArgs = new ResolveTokensArgs(contextItem, query);
            CorePipeline.Run(ResolveTokensPipeline, resolveTokensArgs);

            return resolveTokensArgs.Query;
        }
    }
}