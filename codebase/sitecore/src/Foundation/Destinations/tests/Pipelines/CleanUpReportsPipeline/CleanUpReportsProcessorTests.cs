using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Pipelines.CleanUpReportsPipeline;
using easyJet.Foundation.SitecoreExtensions.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.Configuration;
using Sitecore.FakeDb;
using Sitecore.Pipelines;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Pipelines.CleanUpReportsPipeline
{
    public class CleanUpReportsProcessorTests
    {
        private readonly IDestinationsLogger logger;
        private readonly CleanUpReportsProcessor processor;
        private readonly IUserCreationService creationService;

        public CleanUpReportsProcessorTests()
        {
            logger = Substitute.For<IDestinationsLogger>();
            creationService = Substitute.For<IUserCreationService>();
            var user = Substitute.ForPartsOf<Sitecore.Security.Accounts.User>("test", false);
            creationService.GetOrCreateNonAnonymousUser(Arg.Any<string>()).Returns(user);
            processor = new CleanUpReportsProcessor(logger, creationService);
        }

        [Theory]
        [AutoData]
        public void Process_ShouldProcessCleanUpReportsProcessor_IfReportsExist(Db db)
        {
            // Arrange
            var reportsFolderDbItem = new DbItem("Reports");
            var reportDbItem = new DbItem("Report");
            reportsFolderDbItem.Add(reportDbItem);
            db.Add(reportsFolderDbItem);

            var args = new PipelineArgs();
            args.ProcessorItem = new Sitecore.Data.Items.ProcessorItem(db.GetItem(reportsFolderDbItem.ID));

            using (new SettingsSwitcher("Destinations.ReportLifeSpanInDays", "1"))
            {
                // Act
                processor.Process(args);

                // Assert
                args.Aborted.Should().BeFalse();
            }
        }
    }
}
