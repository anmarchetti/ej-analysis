using easyJet.Foundation.Optimizely.Pipelines.Initialize;
using FluentAssertions;
using NSubstitute;
using OptimizelySDK;
using Sitecore.Pipelines;
using Xunit;

namespace easyJet.Foundation.Optimizely.Tests.Pipelines.Initialize
{
    public class InitializeOptimizelyTests
    {
        [Fact]
        public void Process_ShouldTouchOptimizelyConfigToStartPolling()
        {
            var optimizely = Substitute.For<IOptimizely>();
            var sut = new InitializeOptimizely(optimizely);

            sut.Process(new PipelineArgs());

            optimizely.Received(1).GetOptimizelyConfig();
        }

        [Fact]
        public void Constructor_ShouldStoreOptimizelyDependency()
        {
            var optimizely = Substitute.For<IOptimizely>();

            var sut = new InitializeOptimizely(optimizely);

            sut.Should().NotBeNull();
        }
    }
}
