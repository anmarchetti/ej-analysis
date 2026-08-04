using Sitecore.Pipelines;

namespace easyJet.Feature.PageContent.Pipelines.ItemResolving
{
    public abstract class CreateResolveItemResultProcessor : CoreProcessor
    {
        public abstract void Process(CreateResolveItemResultArgs args);
    }
}