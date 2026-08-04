using System.Diagnostics.CodeAnalysis;
using Amazon;
using Amazon.DynamoDBv2;
using easyJet.Foundation.DynamoDb.Factory;
using easyJet.Foundation.DynamoDb.Repositories.Base;
using Microsoft.Extensions.DependencyInjection;
using Sitecore.DependencyInjection;

namespace easyJet.Foundation.DynamoDb.Infrastructure
{
    [ExcludeFromCodeCoverage]
    public class AwsDynamoDbServiceConfigurator : IServicesConfigurator
    {
        public void Configure(IServiceCollection serviceCollection)
        {
            serviceCollection.AddScoped(typeof(IAwsDynamoDbRepository<>), typeof(AwsDynamoDbRepository<>));
            serviceCollection.AddTransient(typeof(IAwsDynamoDbContextFactory<>), typeof(AwsDynamoDbContextFactory<>));
            serviceCollection.AddTransient<IAmazonDynamoDB>(factory => GetClient());
        }

        private AmazonDynamoDBClient GetClient()
        {
            var region = Sitecore.Configuration.Settings.GetSetting(Constants.AwsDynamoDbSettings.Settings.RegionSettingsName);
            var regionEndPoint = RegionEndpoint.GetBySystemName(region);
            return new AmazonDynamoDBClient(regionEndPoint);
        }
    }
}
