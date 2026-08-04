using System.Diagnostics.CodeAnalysis;
using Amazon;
using Amazon.S3;
using easyJet.Foundation.SitecoreExtensions.Services;
using Microsoft.Extensions.DependencyInjection;
using Sitecore.DependencyInjection;

namespace easyJet.Foundation.AmazonS3.Infrastructure
{
    [ExcludeFromCodeCoverage]
    public class AmazonS3ServiceConfigurator : IServicesConfigurator
    {
        public void Configure(IServiceCollection serviceCollection)
        {
            serviceCollection.AddTransient<IAmazonS3>(factory => new AmazonS3Client(RegionEndpoint.GetBySystemName(Sitecore.Configuration.Settings.GetSetting(Constants.Settings.RegionSettingsName))));
            serviceCollection.AddTransient<IJobStatusService, JobStatusService>();
        }
    }
}
