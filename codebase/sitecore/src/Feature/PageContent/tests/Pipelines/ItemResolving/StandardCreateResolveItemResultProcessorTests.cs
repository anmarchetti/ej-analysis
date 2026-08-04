using easyJet.Feature.PageContent.Pipelines.ItemResolving;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data;
using Sitecore.FakeDb;
using Xunit;

namespace easyJet.Feature.PageContent.Tests.Pipelines.ItemResolving
{
    public class StandardCreateResolveItemResultProcessorTests
    {
        private readonly StandardItemValidator itemValidator;
        private readonly StandardCreateResolveItemResultProcessor sut;

        public StandardCreateResolveItemResultProcessorTests()
        {
            itemValidator = Substitute.For<StandardItemValidator>();
            sut = Substitute.ForPartsOf<StandardCreateResolveItemResultProcessor>();
        }

        [Fact]
        public void Process_ArgsResultAlreadyPopulated_ReturnsWithoutFurtherAction()
        {
            // Arrange
            var args = new CreateResolveItemResultArgs(default, default) { Result = new ResolveItemResult(default) };
            // Act
            sut.Process(args);

            // Assert
            sut.DidNotReceiveWithAnyArgs().PipelineExecutionWrapper(default);
        }

        [Fact]
        public void Process_ItemValidationFails_ReturnsNoItemFound()
        {
            // Arrange
            var id = ID.NewID;
            var db = new Db()
            {
                new DbItem("testItem", id)
            };
            var args = new CreateResolveItemResultArgs(db.GetItem(id), default);
            sut.WhenForAnyArgs(mock => mock.PipelineExecutionWrapper(default)).DoNotCallBase();
            sut.PipelineExecutionWrapper(default).ReturnsForAnyArgs(false);

            // Act
            sut.Process(args);

            // Assert
            args.Result.Item.Should().BeNull();
        }

        [Fact]
        public void Process_ItemValidationSucceeds_ReturnsItem()
        {
            // Arrange
            var id = ID.NewID;
            var db = new Db()
            {
                new DbItem("testItem", id)
            };
            var args = new CreateResolveItemResultArgs(db.GetItem(id), default);
            sut.WhenForAnyArgs(mock => mock.PipelineExecutionWrapper(default)).DoNotCallBase();
            sut.PipelineExecutionWrapper(default).ReturnsForAnyArgs(true);

            // Act
            sut.Process(args);

            // Assert
            args.Result.Item.ID.Should().BeEquivalentTo(id);
        }
    }
}