namespace easyJet.Foundation.Optimizely.Infrastructure
{
    using System;
    using Microsoft.Extensions.DependencyInjection;
    using OptimizelySDK;
    using OptimizelySDK.Config;
    using Sitecore.DependencyInjection;

    public class OptimizelyServicesConfigurator : IServicesConfigurator
    {
        private const int DefaultPollingIntervalInMinutes = 5;

        /// <inheritdoc/>
        public void Configure(IServiceCollection serviceCollection)
        {
            serviceCollection.AddSingleton<IOptimizely>(provider =>
            {
                var sdkKey = Sitecore.Configuration.Settings.GetSetting(Constants.OptimizelySettings.SdkKey);
                var pollingInMinutes = int.TryParse(Sitecore.Configuration.Settings.GetSetting(Constants.OptimizelySettings.PollingMinutes), out var m) ? m : DefaultPollingIntervalInMinutes;

                var mgrBuilder = new HttpProjectConfigManager.Builder()
                    .WithSdkKey(sdkKey)
                    .WithPollingInterval(TimeSpan.FromMinutes(pollingInMinutes));

                var projectConfigManager = mgrBuilder.Build();
                return new Optimizely(projectConfigManager);
            });
        }
    }
}
