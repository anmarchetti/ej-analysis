using System;
using System.Collections.Generic;
using AutoFixture;
using easyJet.Feature.PageContent.Pipelines.ItemResolving;
using easyJet.Feature.PageContent.Pipelines.TransparentFolder;
using FluentAssertions;
using NSubstitute;
using NSubstitute.Extensions;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Xunit;

namespace easyJet.Feature.PageContent.Tests.Pipelines.TransparentFolder
{
    public class ResolveTransparentFolderProcessorTests
    {
        private readonly Fixture fixture;
        private readonly StandardPathToItemResolver standardPathToItemResolver;
        private readonly ResolveTransparentFolderProcessor sut;

        public ResolveTransparentFolderProcessorTests()
        {
            fixture = new Fixture();

            standardPathToItemResolver = Substitute.ForPartsOf<StandardPathToItemResolver>();

            sut = Substitute.ForPartsOf<ResolveTransparentFolderProcessor>();
        }

        [Fact]
        public void GetTransparentFolders_NoTransparentChildren_ReturnsEmptyList()
        {
            // Arrange
            var parentId = ID.NewID;
            var db = new Db()
            {
                new DbItem("parentItem", parentId)
                {
                    new DbItem("a regular child item")
                }
            };
            var parentItem = db.GetItem(parentId);

            // Act
            var result = sut.GetTransparentFolders(parentItem);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEmpty();
        }

        [Fact]
        public void GetTransparentFolders_HasTransparentChild_ReturnsInList()
        {
            // Arrange
            var parentId = ID.NewID;
            var db = new Db()
            {
                new DbItem("parentItem", parentId)
                {
                    new DbItem("a transparent child item")
                    {
                        Fields = { { Constants.Fields.TransparentFolder.TransparentItem, "1" } }
                    }
                }
            };
            var parentItem = db.GetItem(parentId);

            // Act
            var result = sut.GetTransparentFolders(parentItem);

            // Assert
            result.Should().NotBeNullOrEmpty();
        }

        [Fact]
        public void GetTransparentFolders_HasTransparentAndRegularChildren_ReturnsOnlyTransparentInList()
        {
            // Arrange
            var parentId = ID.NewID;
            var transparentChildId = ID.NewID;
            var db = new Db()
            {
                new DbItem("parentItem", parentId)
                {
                    new DbItem("a regular child item"),
                    new DbItem("a transparent child item", transparentChildId)
                    {
                        Fields = { { Constants.Fields.TransparentFolder.TransparentItem, "1" } }
                    }
                }
            };
            var parentItem = db.GetItem(parentId);

            // Act
            var result = sut.GetTransparentFolders(parentItem);

            // Assert
            result.Should().NotBeNullOrEmpty();
            result.Should().HaveCount(1);
            result.Should().Contain(element => element.ItemID.Equals(transparentChildId));
        }

        [Fact]
        public void Process_UriNotPresentInDB_SetsArgsResultToNotFound()
        {
            // Arrange
            var db = new Db();
            var getTransparentFoldersResult = new List<DataUri>()
            {
                new ItemUri(ID.NewID, db.Database).ToDataUri()
            };
            sut.Configure().GetTransparentFolders(default).ReturnsForAnyArgs(getTransparentFoldersResult);
            var args = new ResolvePathToItemArgs(default, default, default, default);

            // Act
            sut.Process(args);

            // Assert
            sut.DidNotReceiveWithAnyArgs().ContinueResolving(default, default, default);
            args.Result.Item.Should().BeNull();
        }

        [Fact]
        public void Process_ContinueResolvingFailsToResolve_SetsArgsResultToNotFound()
        {
            // Arrange
            var rootId = ID.NewID;
            var rootName = "root";
            var folderName = "transparentFolder";
            var childId = ID.NewID;
            var childName = "childOfTransparentFolder";

            var pathParts = new string[] { rootName, fixture.Create<string>() };
            var path = string.Join("/", rootName, fixture.Create<string>()); // omitting the transparent folder
            var resolveItemArgs = new ResolveItemArgs(path);

            var resolveSettings = new ResolveItemSettings();

            var db = new Db
            {
                new DbItem(rootName, rootId)
                {
                    new DbItem(folderName)
                    {
                        Fields = { { Constants.Fields.TransparentFolder.TransparentItem, "1" } },
                        Children = { new DbItem(childName, childId) }
                    }
                }
            };
            var rootItem = db.GetItem(rootId);
            var resolvePathArgs = new ResolvePathToItemArgs(rootItem, pathParts, resolveItemArgs, resolveSettings);

            sut.Configure().ContinueResolving(default, default, default).ReturnsForAnyArgs(_ => resolvePathArgs.Result);

            // Act
            sut.Process(resolvePathArgs);

            // Assert
            resolvePathArgs.Result.Item.Should().BeNull();
        }

        [Fact]
        public void Process_ContinueResolvingResolvesChildItem_SetsArgsResultToChildItem()
        {
            // Arrange
            var rootId = ID.NewID;
            var rootName = "root";
            var folderName = "transparentFolder";
            var childId = ID.NewID;
            var childName = "childOfTransparentFolder";

            var pathParts = new string[] { rootName, fixture.Create<string>() };
            var path = string.Join("/", rootName, fixture.Create<string>()); // omitting the transparent folder
            var resolveItemArgs = new ResolveItemArgs(path);

            var resolveSettings = new ResolveItemSettings();

            var db = new Db
            {
                new DbItem(rootName, rootId)
                {
                    new DbItem(folderName)
                    {
                        Fields = { { Constants.Fields.TransparentFolder.TransparentItem, "1" } },
                        Children = { new DbItem(childName, childId) }
                    }
                }
            };
            var rootItem = db.GetItem(rootId);
            var resolvePathArgs = new ResolvePathToItemArgs(rootItem, pathParts, resolveItemArgs, resolveSettings);

            var childItem = db.GetItem(childId);

            sut.Configure().ContinueResolving(default, default, default).ReturnsForAnyArgs(_ =>
            {
                resolvePathArgs.Result = new ResolveItemResult(childItem);
                return resolvePathArgs.Result;
            });

            // Act
            sut.Process(resolvePathArgs);

            // Assert
            resolvePathArgs.Result.Item.Should().NotBeNull();
            resolvePathArgs.Result.Item.ID.Should().BeEquivalentTo(childItem.ID);
        }

        [Fact]
        public void Process_WithAlreadyPresentItem_ReturnsWithoutFurtherAction()
        {
            // Arrange
            var args = new ResolvePathToItemArgs(null, Array.Empty<string>(), null, null);
            var db = fixture.Create<Db>();
            var id = ID.NewID;
            db.Add(new DbItem("anyItem", id));
            var anyItem = db.GetItem(id);
            args.Result = new ResolveItemResult(anyItem);
            sut.WhenForAnyArgs(sut => sut.GetTransparentFolders(default)).DoNotCallBase();
            sut.When(sut => sut.ContinueResolving(Arg.Any<ResolvePathToItemArgs>(), Arg.Any<Item>(), Arg.Any<int>())).DoNotCallBase();

            // Act
            sut.Process(args);

            // Assert
            sut.DidNotReceiveWithAnyArgs().GetTransparentFolders(default);
            sut.DidNotReceiveWithAnyArgs().ContinueResolving(default, default, default);
        }
    }
}
