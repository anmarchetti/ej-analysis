using Amazon.SQS;
using Microsoft.Extensions.DependencyInjection;
using Sitecore.DependencyInjection;

namespace easyJet.Foundation.AmazonSqs.Infrastructure
{
    public class AmazonSqsServiceConfigurator : IServicesConfigurator
    {
        public void Configure(IServiceCollection serviceCollection)
        {
            serviceCollection.AddTransient<IAmazonSQS>(factory => new AmazonSQSClient());
        }
    }
}