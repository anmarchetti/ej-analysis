using easyJet.Feature.PageContent.Pipelines.ItemResolving;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data;
using Sitecore.FakeDb;
using Sitecore.FakeDb.Pipelines;
using Xunit;

namespace easyJet.Feature.PageContent.Tests.Pipelines.ItemResolving
{
    public class StandardValidatorResultProcessorTests
    {
        private readonly StandardItemValidator standardItemValidator;
        private readonly StandardValidatorResultProcessor sut;

        public StandardValidatorResultProcessorTests()
        {
            standardItemValidator = Substitute.For<StandardItemValidator>();
            sut = Substitute.ForPartsOf<StandardValidatorResultProcessor>();
        }

        [Fact]
        public void Process_ItemIsNull_ReturnsWithoutFurtherAction()
        {
            // Arrange
            var db = new Db();
            var mockProcessor = Substitute.For<IPipelineProcessor>();
            mockProcessor.WhenForAnyArgs(mock => mock.Process(default)).Do(ci => standardItemValidator.Process(ci.Args()[0] as IsValidItemArgs));
            db.PipelineWatcher.Register(Constants.Pipelines.ResolvePathToItem.IsValidItem, mockProcessor);

            var args = new CreateResolveItemResultArgs(default, default) { Result = new ResolveItemResult(null) };

            // Act
            sut.Process(args);

            // Assert
            standardItemValidator.DidNotReceiveWithAnyArgs().Process(default);
        }

        [Fact]
        public void Process_ItemValidationFails_SetsResultItemToNotFound()
        {
            // Arrange
            var id = ID.NewID;
            var db = new Db()
            {
                new DbItem("testItem", id)
            };

            var item = db.GetItem(id);
            var args = new CreateResolveItemResultArgs(default, default) { Result = new ResolveItemResult(item) };

            sut.WhenForAnyArgs(mock => mock.PipelineExecutionWrapper(default)).DoNotCallBase();
            sut.PipelineExecutionWrapper(default).ReturnsForAnyArgs(false);

            // Act
            sut.Process(args);

            // Assert
            args.Result.Should().BeEquivalentTo(ResolveItemResult.NoItemFound);
        }

        [Fact]
        public void Process_ItemValidationSucceeds_DoesNotChangeResultItem()
        {
            // Arrange
            var id = ID.NewID;
            var db = new Db()
            {
                new DbItem("testItem", id)
            };

            var item = db.GetItem(id);
            var args = new CreateResolveItemResultArgs(default, default) { Result = new ResolveItemResult(item) };

            sut.WhenForAnyArgs(mock => mock.PipelineExecutionWrapper(default)).DoNotCallBase();
            sut.PipelineExecutionWrapper(default).ReturnsForAnyArgs(true);

            // Act
            sut.Process(args);

            // Assert
            args.Result.Item.Should().BeEquivalentTo(item);
        }
    }
}
