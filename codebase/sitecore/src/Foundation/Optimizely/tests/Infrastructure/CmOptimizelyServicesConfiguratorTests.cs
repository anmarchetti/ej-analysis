using easyJet.Foundation.Optimizely.Infrastructure;
using easyJet.Foundation.Optimizely.Services;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace easyJet.Foundation.Optimizely.Tests.Infrastructure
{
    public class CmOptimizelyServicesConfiguratorTests
    {
        [Fact]
        public void Configure_ShouldRegisterDisabledOptimizelyServiceAsTransient()
        {
            var serviceCollection = new ServiceCollection();
            var sut = new CmOptimizelyServicesConfigurator();

            sut.Configure(serviceCollection);

            serviceCollection.Should().ContainSingle(descriptor =>
                descriptor.ServiceType == typeof(IOptimizelyService)
                && descriptor.ImplementationType == typeof(DisabledOptimizelyService)
                && descriptor.Lifetime == ServiceLifetime.Transient);
        }
    }
}
