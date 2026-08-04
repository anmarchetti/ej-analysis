using System;
using easyJet.Foundation.Analytics.Logging;
using easyJet.Foundation.Analytics.Pipelines.StartAnalytics;
using easyJet.Foundation.Analytics.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.Pipelines;
using Xunit;

namespace easyJet.Foundation.Analytics.Tests.Pipelines.StartAnalytics
{
    public class CheckCookieConsentTests
    {
        private readonly IConsentService consentService;
        private readonly IAnalyticsLogger logger;
        private readonly CheckCookieConsent pipeline;

        public CheckCookieConsentTests()
        {
            consentService = Substitute.For<IConsentService>();
            logger = Substitute.For<IAnalyticsLogger>();
            pipeline = new CheckCookieConsent(logger, consentService);
        }

        [Fact]
        public void Process_ShouldAbortedPipeline_IfMarketingCookieIsNotSet()
        {
            // Arrange
            consentService.IsPersonalizationConsentGiven().Returns(false);
            var args = new PipelineArgs();

            // Act
            pipeline.Process(args);

            // Assert
            args.Aborted.Should().BeTrue();
        }

        [Fact]
        public void Process_ShouldNotAbortedPipeline_IfMarketingCookieValueIsOne()
        {
            // Arrange
            var args = new PipelineArgs();
            consentService.IsPersonalizationConsentGiven().Returns(true);

            // Act
            pipeline.Process(args);

            // Assert
            args.Aborted.Should().BeFalse();
        }

        [Fact]
        public void Process_ShouldThrowException_IfNoPipelineArgs()
        {
            // Arrange
            PipelineArgs args = null;

            // Act
            Action actual = () => pipeline.Process(args);

            // Assert
            actual.Should().Throw<ArgumentNullException>();
        }
    }
}
