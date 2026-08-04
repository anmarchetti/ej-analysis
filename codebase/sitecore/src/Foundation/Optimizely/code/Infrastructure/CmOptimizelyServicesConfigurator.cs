namespace easyJet.Foundation.Optimizely.Infrastructure
{
    using easyJet.Foundation.Optimizely.Services;
    using Microsoft.Extensions.DependencyInjection;
    using Sitecore.DependencyInjection;

    public class CmOptimizelyServicesConfigurator : IServicesConfigurator
    {
        public void Configure(IServiceCollection serviceCollection)
        {
            serviceCollection.AddTransient<IOptimizelyService, DisabledOptimizelyService>();
        }
    }
}
