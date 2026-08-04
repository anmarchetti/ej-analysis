using Sitecore.Pipelines;

namespace easyJet.Foundation.SitecoreExtensions.Interfaces
{
    public interface IPipelineProcessor<in T>
        where T : PipelineArgs, new()
    {
        void Process(T args);
    }
}
