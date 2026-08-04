using Sitecore.Diagnostics;
using Sitecore.Pipelines.GetLookupSourceItems;

namespace easyJet.Foundation.Multisite.Pipelines.GetLookupSourceItems
{
    public class ResolveTokenizedLookupSourceProcessor
    {
        public void Process(GetLookupSourceItemsArgs args)
        {
            Assert.IsNotNull(args, nameof(args));

            if (args.Source.Contains("$"))
            {
                args.Source = TokenResolver.Resolve(args.Item, args.Source);
            }
        }
    }
}