using Sitecore.Pipelines;

namespace easyJet.Feature.PageContent.Pipelines.ItemResolving
{
    public abstract class IsValidItemProcessor : CoreProcessor
    {
        public abstract void Process(IsValidItemArgs args);
    }
}