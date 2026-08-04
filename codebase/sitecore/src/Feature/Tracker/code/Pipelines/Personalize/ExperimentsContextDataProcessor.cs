using System.Web.Mvc;
using easyJet.Feature.Tracker.Services.Personalize;
using Sitecore.LayoutService.ItemRendering.Pipelines.GetLayoutServiceContext;

namespace easyJet.Feature.Tracker.Pipelines.Personalize
{
    public class ExperimentsContextDataProcessor : IGetLayoutServiceContextProcessor
    {
        public const string ExperimentsPropertyName = "experiments";

        public void Process(GetLayoutServiceContextArgs args)
        {
            var personalizationContext = ResolveScopedPersonalizationContext();
            var experiments = personalizationContext.GetAllPersonalizations();
            args.ContextData.Add(ExperimentsPropertyName, experiments);
        }

        // add this work around to resolve scoped service as processor initialized on the start of app and doesn't update scoped
        private static IPersonalizationContext ResolveScopedPersonalizationContext() => DependencyResolver.Current.GetService<IPersonalizationContext>();
    }
}
