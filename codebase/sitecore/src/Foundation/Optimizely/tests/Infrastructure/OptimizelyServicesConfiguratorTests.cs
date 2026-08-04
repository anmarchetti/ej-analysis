using easyJet.Foundation.Optimizely.Infrastructure;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using OptimizelySDK;
using Xunit;

namespace easyJet.Foundation.Optimizely.Tests.Infrastructure
{
    public class OptimizelyServicesConfiguratorTests
    {
        [Fact]
        public void Configure_ShouldRegisterOptimizelyAsSingleton()
        {
            var serviceCollection = new ServiceCollection();
            var sut = new OptimizelyServicesConfigurator();

            sut.Configure(serviceCollection);

            serviceCollection.Should().ContainSingle(descriptor =>
                descriptor.ServiceType == typeof(IOptimizely)
                && descriptor.Lifetime == ServiceLifetime.Singleton);
        }
    }
}
