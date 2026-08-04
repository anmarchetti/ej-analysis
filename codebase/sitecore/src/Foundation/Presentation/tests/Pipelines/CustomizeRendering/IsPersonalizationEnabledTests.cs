using easyJet.Foundation.Analytics.Services;
using easyJet.Foundation.Presentation.Logging;
using easyJet.Foundation.Presentation.Pipelines.CustomizeRendering;
using FluentAssertions;
using NSubstitute;
using Sitecore.Mvc.Presentation;
using Sitecore.Personalization.Mvc.Pipelines.Response.CustomizeRendering;
using Xunit;

namespace easyJet.Foundation.Presentation.Tests.Pipelines.CustomizeRendering
{
    public class IsPersonalizationEnabledTests
    {
        private readonly IConsentService consentService;
        private readonly IPresentationLogger logger;
        private readonly IsPersonalizationEnabled pipeline;

        public IsPersonalizationEnabledTests()
        {
            consentService = Substitute.For<IConsentService>();
            logger = Substitute.For<IPresentationLogger>();
            pipeline = new IsPersonalizationEnabled(logger, consentService);
        }

        [Fact]
        public void Process_ShouldAbortedPipeline_IfPersonalizationIsDisabled()
        {
            // Arrange
            consentService.IsPersonalizationEnabled().Returns(false);
            var args = new CustomizeRenderingArgs(new Rendering());

            // Act
            pipeline.Process(args);

            // Assert
            args.Aborted.Should().BeTrue();
        }

        [Fact]
        public void Process_ShouldNotAbortedPipeline_IfPersonalizationIsEnabled()
        {
            // Arrange
            var args = new CustomizeRenderingArgs(new Rendering());
            consentService.IsPersonalizationEnabled().Returns(true);

            // Act
            pipeline.Process(args);

            // Assert
            args.Aborted.Should().BeFalse();
        }
    }
}
