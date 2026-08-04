using AutoFixture;
using easyJet.Foundation.Multisite.Logging;
using easyJet.Foundation.Multisite.Pipelines.RebuildIndex;
using easyJet.Foundation.SitecoreExtensions.Indexing;
using NSubstitute;
using Sitecore.FakeDb;
using Sitecore.Pipelines;
using Xunit;

namespace easyJet.Foundation.Multisite.Tests.Pipelines.RebuildIndex
{
    public class RebuildIndexProcessorTests
    {
        private readonly IMultisiteLogger multisiteLogger;
        private readonly IIndexingService indexingService;
        private readonly Fixture fixture;
        private readonly Db db;
        private readonly RebuildIndexProcessor rebuildIndexProcessor;

        public RebuildIndexProcessorTests()
        {
            fixture = new Fixture();
            db = fixture.Freeze<Db>();
            multisiteLogger = Substitute.For<IMultisiteLogger>();
            indexingService = Substitute.For<IIndexingService>();
            rebuildIndexProcessor = new RebuildIndexProcessor(multisiteLogger, indexingService);
        }

        [Fact]
        public void Process_ShouldWarnIndexNameEmpty_IfIndexNameEmpty()
        {
            // Arrange
            var processorItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            db.Add(processorItem);

            var args = new PipelineArgs();
            args.ProcessorItem = db.GetItem(processorItem.ID);

            // Act
            rebuildIndexProcessor.Process(args);

            // Assert
            multisiteLogger.Received(1).Warn(Arg.Any<string>(), Arg.Any<object>());
        }

        [Fact]
        public void Process_ShouldInfoStartRebuildIndex_IfIndexNameNotNull()
        {
            // Arrange
            var processorItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            var indexNameField = new DbField(Constants.Fields.IndexRebuildSchedule.IndexName)
            {
                Value = "fake_index_name"
            };

            processorItem.Fields.Add(indexNameField);

            db.Add(processorItem);

            var args = new PipelineArgs();
            args.ProcessorItem = db.GetItem(processorItem.ID);

            // Act
            try
            {
                rebuildIndexProcessor.Process(args);
            }
            catch
            {
            }

            // Assert
            multisiteLogger.Received(1).Info(Arg.Any<string>(), Arg.Any<object>());
        }
    }
}
