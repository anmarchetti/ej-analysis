using easyJet.Foundation.DependencyInjection.Extensions;
using Sitecore.DependencyInjection;

namespace easyJet.Foundation.DependencyInjection.Infrastructure
{
    public class MvcControllerServicesConfigurator : IServicesConfigurator
    {
        private const string FeatureAssemblies = "easyJet.Feature.*";
        private const string FoundationAssemblies = "easyJet.Foundation.*";

        public void Configure(Microsoft.Extensions.DependencyInjection.IServiceCollection serviceCollection)
        {
            serviceCollection.AddMvcControllers(FeatureAssemblies);
            serviceCollection.AddMvcControllers(FoundationAssemblies);
            serviceCollection.AddApiControllers(FeatureAssemblies);
            serviceCollection.AddClassesWithServiceAttribute(FeatureAssemblies);
            serviceCollection.AddClassesWithServiceAttribute(FoundationAssemblies);
        }
    }
}