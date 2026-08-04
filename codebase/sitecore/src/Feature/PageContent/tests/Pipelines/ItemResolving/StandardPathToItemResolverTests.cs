using System;
using System.Collections.Generic;
using easyJet.Feature.PageContent.Pipelines.ItemResolving;
using FluentAssertions;
using NSubstitute;
using NSubstitute.Extensions;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Xunit;

namespace easyJet.Feature.PageContent.Tests.Pipelines.ItemResolving
{
    public class StandardPathToItemResolverTests
    {
        private readonly StandardPathToItemResolver sut;

        public StandardPathToItemResolverTests()
        {
            sut = Substitute.ForPartsOf<StandardPathToItemResolver>();
        }

        [Fact]
        public void Process_RootItemInArgsIsNull_LogsAndReturnsWithoutFurtherAction()
        {
            // Arrange
            var args = new ResolvePathToItemArgs(default, Array.Empty<string>(), default, default, default);

            // Act
            sut.Process(args);

            // Assert
            sut.ReceivedWithAnyArgs().LogWrapper(default);
            sut.DidNotReceiveWithAnyArgs().GetMatchingChildren(default, default);
            sut.DidNotReceiveWithAnyArgs().ContinueResolving(default, default, default);
        }

        [Fact]
        public void Process_FailsToContinueResolving_ContinuesWithoutFurtherAction()
        {
            // Arrange
            var rootItemId = ID.NewID;
            var resolvedItemId = ID.NewID;
            var db = new Db()
            {
                new DbItem("testRootItem", rootItemId),
                new DbItem("testResolvedItem", resolvedItemId)
            };
            var rootItem = db.GetItem(rootItemId);
            var resolvedItem = db.GetItem(resolvedItemId);
            var args = new ResolvePathToItemArgs(rootItem, new string[] { string.Empty }, default, default);
            sut.Configure().WhenForAnyArgs(mock => mock.GetMatchingChildren(default, default)).DoNotCallBase();
            sut.GetMatchingChildren(default, default).ReturnsForAnyArgs(new List<Item> { rootItem });
            sut.Configure().WhenForAnyArgs(mock => mock.ContinueResolving(default, default, default)).DoNotCallBase();
            sut.ContinueResolving(default, default, default).ReturnsForAnyArgs(ResolveItemResult.NoItemFound);

            // Act
            sut.Process(args);

            // Assert
            args.Result.Should().NotBeNull();
            args.Result.Item.Should().NotBeEquivalentTo(resolvedItem);
            args.Aborted.Should().BeFalse();
        }

        [Fact]
        public void Process_SuccessfullyContinuesResolving_AbortsPipelineAndSetsResultItem()
        {
            // Arrange
            var rootItemId = ID.NewID;
            var resolvedItemId = ID.NewID;
            var db = new Db()
            {
                new DbItem("testRootItem", rootItemId),
                new DbItem("testResolvedItem", resolvedItemId)
            };
            var rootItem = db.GetItem(rootItemId);
            var resolvedItem = db.GetItem(resolvedItemId);
            var args = new ResolvePathToItemArgs(rootItem, new string[] { string.Empty }, default, default);
            sut.Configure().WhenForAnyArgs(mock => mock.GetMatchingChildren(default, default)).DoNotCallBase();
            sut.GetMatchingChildren(default, default).ReturnsForAnyArgs(new List<Item> { rootItem });
            sut.Configure().WhenForAnyArgs(mock => mock.ContinueResolving(default, default, default)).DoNotCallBase();
            sut.ContinueResolving(default, default, default).ReturnsForAnyArgs(new ResolveItemResult(resolvedItem));

            // Act
            sut.Process(args);

            // Assert
            args.Result.Should().NotBeNull();
            args.Result.Item.Should().BeEquivalentTo(resolvedItem);
            args.Aborted.Should().BeTrue();
        }
    }
}
