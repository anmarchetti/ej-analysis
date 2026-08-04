using Sitecore.Pipelines;

namespace easyJet.Feature.PageContent.Pipelines.ItemResolving
{
    public abstract class ResolveItemProcessor : CoreProcessor
    {
        public abstract void Process(ResolveItemArgs args);
    }
}