using System;
using easyJet.Foundation.AmazonS3.Logging;
using easyJet.Foundation.AmazonS3.Pipelines.AmazonS3CleanUpImagesReportPipeline;
using easyJet.Foundation.SitecoreExtensions.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.Configuration;
using Sitecore.NSubstituteUtils;
using Sitecore.Pipelines;
using Sitecore.Security.Accounts;
using Xunit;

namespace easyJet.Foundation.AmazonS3.Tests.Pipelines
{
    public class CleanUpImagesReportProcessorTests : IDisposable
    {
        private readonly IAmazonS3Logger logger;
        private readonly CleanUpImagesReportProcessor cleanUpImagesReportPipelineProcessor;
        private readonly SettingsSwitcher settingSwitcher;
        private readonly IUserCreationService creationService;

        public CleanUpImagesReportProcessorTests()
        {
            settingSwitcher = new SettingsSwitcher("AmazonS3.ImageReportLifeSpanInDays", "0");
            logger = Substitute.For<IAmazonS3Logger>();
            creationService = Substitute.For<IUserCreationService>();
            var user = Substitute.ForPartsOf<User>("test", false);
            creationService.GetOrCreateNonAnonymousUser(Arg.Any<string>()).Returns(user);
            cleanUpImagesReportPipelineProcessor = new CleanUpImagesReportProcessor(logger, creationService);
        }

        [Fact]
        public void Execute_ShouldDeleteItems_IfTheyExistInDatabase()
        {
            // Arrange
            var reportsFolderFakeItem = new FakeItem().WithName("Reports");
            var reportFakeItem = new FakeItem().WithName("Report").WithParent(reportsFolderFakeItem);
            var reportsFolder = reportsFolderFakeItem.ToSitecoreItem();
            reportFakeItem.ToSitecoreItem();

            // Act
            var pipelineArgs = new PipelineArgs { ProcessorItem = reportsFolder };
            cleanUpImagesReportPipelineProcessor.Process(pipelineArgs);

            // Assert
            pipelineArgs.Aborted.Should().BeFalse();
            logger.Received().Debug(Arg.Any<string>(), Arg.Any<object>());
        }

        public void Dispose()
        {
            if (settingSwitcher != null)
            {
                settingSwitcher.Dispose();
            }
        }
    }
}
