using System.Collections.Generic;
using easyJet.Feature.PageContent.Pipelines.ItemResolving;
using easyjet.Foundation.Testing.Attributes;
using FluentAssertions;
using NSubstitute;
using NSubstitute.Extensions;
using Sitecore.Collections;
using Sitecore.Data;
using Sitecore.Data.ItemResolvers;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Sitecore.Globalization;
using Sitecore.NSubstituteUtils;
using Sitecore.Sites;
using Sitecore.Web;
using Xunit;

namespace easyJet.Feature.PageContent.Tests.Pipelines.RequestBegin
{
    public class StandardItemResolverTests : GetItemUrlTestBase
    {
        private readonly StandardItemResolver partialSut;

        public StandardItemResolverTests()
        {
            partialSut = Substitute.ForPartsOf<StandardItemResolver>();
        }

        [Theory]
        [AutoDbData]
        public void Process_WithArgsThatAlreadyHaveAnItem_ReturnsWithoutFurtherAction(Item item)
        {
            // Arrange
            var args = new ResolveItemArgs(string.Empty) { Item = item };

            // Act
            partialSut.Process(args);

            // Assert
            args.Item.Should().BeEquivalentTo(item);
            partialSut.DidNotReceiveWithAnyArgs().GetRoots(default);
        }

        [Theory]
        [AutoDbData]
        public void Process_InPreviewMode_ResolvesFromUrlAndReturnsIfPossible(Item item)
        {
            // Arrange
            var mockCtx = Substitute.For<SiteContext>(new SiteInfo(new StringDictionary()), false);
            mockCtx.DisplayMode.Returns(DisplayMode.Preview);
            var args = new ResolveItemArgs(string.Empty) { Site = mockCtx };
            partialSut.Configure().WhenForAnyArgs(sut => sut.TryGetItemFromQueryItemUri(default, out Arg.Any<Item>())).DoNotCallBase();
            partialSut.Configure().TryGetItemFromQueryItemUri(Arg.Any<ResolveItemArgs>(), out Arg.Any<Item>())
                .Returns(ci =>
                {
                    ci[1] = item;
                    return true;
                });

            // Act
            partialSut.Process(args);

            // Assert
            args.Item.Should().BeEquivalentTo(item);
            partialSut.DidNotReceiveWithAnyArgs().GetRoots(default);
        }

        [Theory]
        [MemberData(nameof(StandardItemResolverTestData.ResolveDifferentPaths), MemberType = typeof(StandardItemResolverTestData))]
        public void Resolve_ResolveNestedItems_DifferentItemNames(string because, string path, List<DtoItem> items, string idNeedsToBeResolved)
        {
            // Arrange
            var fakeSite = CreateFakeSite();
            CreateItemTree(items);
            RegisterPipelines();

            // Act
            var resolvedItem = ProcessItemWrapper(path, fakeSite, idNeedsToBeResolved);

            // Assert
            resolvedItem.ID.ToString().Should().Be(idNeedsToBeResolved, because);
        }

        [Fact]
        public void Resolve_OneLevelOfNestedTransparency_ReturnsMatchingChildItem()
        {
            // Arrange
            var fakeDB = FakeUtil.FakeDatabase("master");
            RegisterPipelines();
            var homeName = "home";
            var firstFolderName = "first";
            var childName = "child";
            var homeItem = new FakeItem(database: fakeDB)
                .WithName(homeName);
            var firstFolderID = ID.NewID;
            var firstFolder = new FakeItem(firstFolderID, fakeDB).WithName(firstFolderName)
                .WithField(Constants.Fields.TransparentFolder.TransparentItem, "1")
                .WithParent(homeItem);
            FakeUtil.FakeItemUri(firstFolder);
            var childItemId = ID.NewID;
            _ = new FakeItem(childItemId, fakeDB).WithName(childName).WithParent(firstFolder);
            var castHomeItem = (Item)homeItem;
            var path = string.Join("/", childName);
            var args = new ResolveItemArgs(path)
            {
                Language = Language.Parse("en"),
                Site = new SiteInfoPropertiesBuilder("fakeSite").WithStartItem(homeName).WithDatabase(fakeDB.Name),
                Database = fakeDB
            };
            partialSut.Configure().GetSiteHome(default, default, default).ReturnsForAnyArgs(castHomeItem);
            fakeDB.GetItem(firstFolder.ToSitecoreItem().Uri.ToDataUri()).Returns(firstFolder.ToSitecoreItem());

            // Act
            partialSut.Process(args);

            // Assert
            args.Item.Should().NotBeNull();
            args.Item.ID.Should().BeEquivalentTo(childItemId);
        }

        [Fact]
        public void Resolve_TwoLevelsOfNestedTransparency_ReturnsMatchingChildItem()
        {
            // Arrange
            var fakeDB = FakeUtil.FakeDatabase("master");
            RegisterPipelines();
            var homeName = "home";
            var firstFolderName = "first";
            var secondFolderName = "second";
            var childName = "child";
            var homeItem = new FakeItem(database: fakeDB)
                .WithName(homeName);
            var firstFolderID = ID.NewID;
            var firstFolder = new FakeItem(firstFolderID, fakeDB).WithName(firstFolderName)
                .WithField(Constants.Fields.TransparentFolder.TransparentItem, "1")
                .WithParent(homeItem);
            FakeUtil.FakeItemUri(firstFolder);
            var secondFolderID = ID.NewID;
            var secondFolder = new FakeItem(secondFolderID, fakeDB).WithName(secondFolderName)
                .WithField(Constants.Fields.TransparentFolder.TransparentItem, "1")
                .WithParent(firstFolder);
            FakeUtil.FakeItemUri(secondFolder);
            var childItemId = ID.NewID;
            _ = new FakeItem(childItemId, fakeDB).WithName(childName).WithParent(secondFolder);
            var castHomeItem = (Item)homeItem;
            var path = string.Join("/", childName);
            var args = new ResolveItemArgs(path)
            {
                Language = Language.Parse("en"),
                Site = new SiteInfoPropertiesBuilder("fakeSite").WithStartItem(homeName).WithDatabase(fakeDB.Name),
                Database = fakeDB
            };
            partialSut.Configure().GetSiteHome(default, default, default).ReturnsForAnyArgs(castHomeItem);
            fakeDB.GetItem(firstFolder.ToSitecoreItem().Uri.ToDataUri()).Returns(firstFolder.ToSitecoreItem());
            fakeDB.GetItem(secondFolder.ToSitecoreItem().Uri.ToDataUri()).Returns(secondFolder.ToSitecoreItem());

            // Act
            partialSut.Process(args);

            // Assert
            args.Item.Should().NotBeNull();
            args.Item.ID.Should().BeEquivalentTo(childItemId);
        }

        [Fact]
        public void Resolve_ThreeLevelsOfNestedTransparency_ReturnsMatchingChildItem()
        {
            // Arrange
            var fakeDB = FakeUtil.FakeDatabase("master");
            RegisterPipelines();
            var homeName = "home";
            var firstFolderName = "first";
            var secondFolderName = "second";
            var thirdFolderName = "third";
            var childName = "child";
            var homeItem = new FakeItem(database: fakeDB)
                .WithName(homeName);
            var firstFolderID = ID.NewID;
            var firstFolder = new FakeItem(firstFolderID, fakeDB).WithName(firstFolderName)
                .WithField(Constants.Fields.TransparentFolder.TransparentItem, "1")
                .WithParent(homeItem);
            FakeUtil.FakeItemUri(firstFolder);
            var secondFolderID = ID.NewID;
            var secondFolder = new FakeItem(secondFolderID, fakeDB).WithName(secondFolderName)
                .WithField(Constants.Fields.TransparentFolder.TransparentItem, "1")
                .WithParent(firstFolder);
            FakeUtil.FakeItemUri(secondFolder);
            var thirdFolderID = ID.NewID;
            var thirdFolder = new FakeItem(thirdFolderID, fakeDB).WithName(thirdFolderName)
                .WithField(Constants.Fields.TransparentFolder.TransparentItem, "1")
                .WithParent(secondFolder);
            FakeUtil.FakeItemUri(thirdFolder);
            var childItemId = ID.NewID;
            _ = new FakeItem(childItemId, fakeDB).WithName(childName).WithParent(thirdFolder);
            var castHomeItem = (Item)homeItem;
            var path = string.Join("/", childName);
            var args = new ResolveItemArgs(path)
            {
                Language = Language.Parse("en"),
                Site = new SiteInfoPropertiesBuilder("fakeSite").WithStartItem(homeName).WithDatabase(fakeDB.Name),
                Database = fakeDB
            };
            partialSut.Configure().GetSiteHome(default, default, default).ReturnsForAnyArgs(castHomeItem);
            fakeDB.GetItem(firstFolder.ToSitecoreItem().Uri.ToDataUri()).Returns(firstFolder.ToSitecoreItem());
            fakeDB.GetItem(secondFolder.ToSitecoreItem().Uri.ToDataUri()).Returns(secondFolder.ToSitecoreItem());
            fakeDB.GetItem(thirdFolder.ToSitecoreItem().Uri.ToDataUri()).Returns(thirdFolder.ToSitecoreItem());

            // Act
            partialSut.Process(args);

            // Assert
            args.Item.Should().NotBeNull();
            args.Item.ID.Should().BeEquivalentTo(childItemId);
        }

        [Fact]
        public void Resolve_ThreeLevelsOfMixedTransparency_ReturnsMatchingChildItem()
        {
            // Arrange
            var fakeDB = FakeUtil.FakeDatabase("master");
            RegisterPipelines();
            var homeName = "home";
            var firstFolderName = "first";
            var secondFolderName = "second";
            var thirdFolderName = "third";
            var childName = "child";
            var homeItem = new FakeItem(database: fakeDB)
                .WithName(homeName);
            var firstFolderID = ID.NewID;
            var firstFolder = new FakeItem(firstFolderID, fakeDB).WithName(firstFolderName)
                .WithField(Constants.Fields.TransparentFolder.TransparentItem, "1")
                .WithParent(homeItem);
            FakeUtil.FakeItemUri(firstFolder);
            var secondFolderID = ID.NewID;
            var secondFolder = new FakeItem(secondFolderID, fakeDB).WithName(secondFolderName)
                .WithField(Constants.Fields.TransparentFolder.TransparentItem, "0")
                .WithParent(firstFolder);
            FakeUtil.FakeItemUri(secondFolder);
            var thirdFolderID = ID.NewID;
            var thirdFolder = new FakeItem(thirdFolderID, fakeDB).WithName(thirdFolderName)
                .WithField(Constants.Fields.TransparentFolder.TransparentItem, "1")
                .WithParent(secondFolder);
            FakeUtil.FakeItemUri(thirdFolder);
            var childItemId = ID.NewID;
            _ = new FakeItem(childItemId, fakeDB).WithName(childName).WithParent(thirdFolder);
            var castHomeItem = (Item)homeItem;
            var path = string.Join("/", secondFolderName, childName);
            var args = new ResolveItemArgs(path)
            {
                Language = Language.Parse("en"),
                Site = new SiteInfoPropertiesBuilder("fakeSite").WithStartItem(homeName).WithDatabase(fakeDB.Name),
                Database = fakeDB
            };
            partialSut.Configure().GetSiteHome(default, default, default).ReturnsForAnyArgs(castHomeItem);
            fakeDB.GetItem(firstFolder.ToSitecoreItem().Uri.ToDataUri()).Returns(firstFolder.ToSitecoreItem());
            fakeDB.GetItem(secondFolder.ToSitecoreItem().Uri.ToDataUri()).Returns(secondFolder.ToSitecoreItem());
            fakeDB.GetItem(thirdFolder.ToSitecoreItem().Uri.ToDataUri()).Returns(thirdFolder.ToSitecoreItem());

            // Act
            partialSut.Process(args);

            // Assert
            args.Item.Should().NotBeNull();
            args.Item.ID.Should().BeEquivalentTo(childItemId);
        }

        [Fact]
        public void Resolve_IdenticalChildrenOnSameTransparencyLevel_ReturnsAnyMatch()
        {
            // Arrange
            var fakeDB = FakeUtil.FakeDatabase("master");
            RegisterPipelines();
            var homeName = "home";
            var firstFolderName = "first";
            var childName = "child";
            var homeItem = new FakeItem(database: fakeDB)
                .WithName(homeName);
            var firstFolderID = ID.NewID;
            var firstFolder = new FakeItem(firstFolderID, fakeDB).WithName(firstFolderName)
                .WithField(Constants.Fields.TransparentFolder.TransparentItem, "1")
                .WithParent(homeItem);
            FakeUtil.FakeItemUri(firstFolder);
            var childItemId = ID.NewID;
            _ = new FakeItem(childItemId, fakeDB).WithName(childName).WithParent(firstFolder);
            var secondChildItemId = ID.NewID;
            _ = new FakeItem(secondChildItemId, fakeDB).WithName(childName).WithParent(firstFolder);
            _ = new FakeItem(ID.NewID, fakeDB).WithName("anotherChildItem").WithParent(firstFolder);
            var castHomeItem = (Item)homeItem;
            var path = string.Join("/", childName);
            var args = new ResolveItemArgs(path)
            {
                Language = Language.Parse("en"),
                Site = new SiteInfoPropertiesBuilder("fakeSite").WithStartItem(homeName).WithDatabase(fakeDB.Name),
                Database = fakeDB
            };
            partialSut.Configure().GetSiteHome(default, default, default).ReturnsForAnyArgs(castHomeItem);
            fakeDB.GetItem(firstFolder.ToSitecoreItem().Uri.ToDataUri()).Returns(firstFolder.ToSitecoreItem());

            // Act
            partialSut.Process(args);

            // Assert
            args.Item.Should().NotBeNull();
            args.Item.ID.Should().BeEquivalentTo(secondChildItemId);
        }

        [Fact]
        public void Resolve_IdenticalChildrenOnSameLevelDueToResolving_ReturnsFirstMatch()
        {
            // Arrange
            var fakeDB = FakeUtil.FakeDatabase("master");
            RegisterPipelines();
            var homeName = "home";
            var firstFolderName = "first";
            var childName = "child";
            var homeItem = new FakeItem(database: fakeDB)
                .WithName(homeName);
            var firstFolderID = ID.NewID;
            var firstFolder = new FakeItem(firstFolderID, fakeDB).WithName(firstFolderName)
                .WithField(Constants.Fields.TransparentFolder.TransparentItem, "1")
                .WithParent(homeItem);
            FakeUtil.FakeItemUri(firstFolder);
            var childItemId = ID.NewID;
            _ = new FakeItem(childItemId, fakeDB).WithName(childName).WithParent(firstFolder);
            var secondChildItemId = ID.NewID;
            _ = new FakeItem(secondChildItemId, fakeDB).WithName(childName).WithParent(homeItem);
            _ = new FakeItem(ID.NewID, fakeDB).WithName("anotherChildItem").WithParent(firstFolder);
            var castHomeItem = (Item)homeItem;
            var path = string.Join("/", childName);
            var args = new ResolveItemArgs(path)
            {
                Language = Language.Parse("en"),
                Site = new SiteInfoPropertiesBuilder("fakeSite").WithStartItem(homeName).WithDatabase(fakeDB.Name),
                Database = fakeDB
            };
            partialSut.Configure().GetSiteHome(default, default, default).ReturnsForAnyArgs(castHomeItem);
            fakeDB.GetItem(firstFolder.ToSitecoreItem().Uri.ToDataUri()).Returns(firstFolder.ToSitecoreItem());

            // Act
            partialSut.Process(args);

            // Assert
            args.Item.Should().NotBeNull();
            args.Item.ID.Should().BeEquivalentTo(secondChildItemId);
        }

        [Fact]
        public void GetRoots_WithNullArgs_ReturnsEmptyList()
        {
            // Arrange

            // Act
            var result = standardItemResolver.GetRoots(null);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEmpty();
        }

        [Fact]
        public void GetRoots_PathStartsWithSitecoreAndSiteIsInPreview_AddsDBRootItem()
        {
            // Arrange
            var mockCtx = Substitute.For<SiteContext>(new SiteInfo(new StringDictionary()), false);
            mockCtx.EnablePreview.Returns(true);
            var args = new ResolveItemArgs("/sitecore/test") { Language = Language.Parse("en"), Site = mockCtx };

            var id = ID.NewID;
            var db = new Db()
            {
                new DbItem("testHome", id)
            };
            var rootItem = db.GetItem(id);
            partialSut.Configure().WhenForAnyArgs(sut => sut.GetRootItem(default)).DoNotCallBase();
            partialSut.Configure().GetRootItem(default).ReturnsForAnyArgs(rootItem);

            // Act
            var result = partialSut.GetRoots(args);

            // Assert
            partialSut.ReceivedWithAnyArgs().GetRootItem(default);
            partialSut.DidNotReceiveWithAnyArgs().GetSiteHome(default, default, default);
            partialSut.DidNotReceiveWithAnyArgs().GetSiteRoot(default, default, default);

            result.Should().NotBeNullOrEmpty();
            result.Should().Contain(rootItem);
        }

        [Fact]
        public void GetRoots_PathDoesNotStartWithSitecore_GetsAndAddsSiteHome()
        {
            // Arrange
            var args = new ResolveItemArgs("anythingButSitecore/text") { Language = Language.Parse("en") };
            var id = ID.NewID;
            var db = new Db()
            {
                new DbItem("testHome", id)
            };
            var homeItem = db.GetItem(id);
            partialSut.Configure().WhenForAnyArgs(sut => sut.GetSiteHome(default, default, default)).DoNotCallBase();
            partialSut.Configure().GetSiteHome(default, default, default).ReturnsForAnyArgs(homeItem);
            partialSut.Configure().WhenForAnyArgs(sut => sut.GetSiteRoot(default, default, default)).DoNotCallBase();

            // Act
            var result = partialSut.GetRoots(args);

            // Assert
            partialSut.ReceivedWithAnyArgs().GetSiteHome(default, default, default);
            partialSut.ReceivedWithAnyArgs().GetSiteRoot(default, default, default);
            result.Should().NotBeNullOrEmpty();
            result.Should().Contain(homeItem);
        }

        [Fact]
        public void GetRoots_PathDoesNotStartWithSitecore_GetsAndAddsSiteRoot()
        {
            // Arrange
            var args = new ResolveItemArgs("anythingButSitecore/text") { Language = Language.Parse("en") };
            var id = ID.NewID;
            var db = new Db()
            {
                new DbItem("testHome", id)
            };
            var rootItem = db.GetItem(id);
            partialSut.Configure().WhenForAnyArgs(sut => sut.GetSiteHome(default, default, default)).DoNotCallBase();
            partialSut.Configure().WhenForAnyArgs(sut => sut.GetSiteRoot(default, default, default)).DoNotCallBase();
            partialSut.Configure().GetSiteRoot(default, default, default).ReturnsForAnyArgs(rootItem);

            // Act
            var result = partialSut.GetRoots(args);

            // Assert
            partialSut.ReceivedWithAnyArgs().GetSiteHome(default, default, default);
            partialSut.ReceivedWithAnyArgs().GetSiteRoot(default, default, default);
            result.Should().NotBeNullOrEmpty();
            result.Should().Contain(rootItem);
        }

        [Fact]
        public void TryGetItemFromQueryItemUri_QueryStringDoesNotContainUri_ReturnsFalse()
        {
            // Arrange
            var args = new ResolveItemArgs(@"https://sc.holidays.local/?sc_itemid=%7BE049292B-7056-4CF1-8F63-D643FFCCD711%7D&sc_mode=preview&sc_lang=en&sc_site=Holidays")
            {
                Language = Language.Parse("en")
            };

            // Act
            var result = partialSut.TryGetItemFromQueryItemUri(args, out var resultingItem);

            // Assert
            result.Should().BeFalse();
            resultingItem.Should().BeNull();
        }

        [Theory]
        [MemberData(nameof(StandardItemResolverTestData.ResolveFullPathsInvalidPathsOrNullDb), MemberType = typeof(StandardItemResolverTestData))]
        public void ResolveFullPath_WithInvalidPathOrNullDatabase_ReturnsNull(ResolveItemArgs invalidArgs)
        {
            // Arrange

            // Act
            var result = partialSut.ResolveFullPath(invalidArgs);

            // Assert
            result.Should().BeNull();
        }

        [Theory]
        [AutoDbData]
        public void ResolveFullPath_NoFullPathInOtherwiseValidArgs_ReturnsNull(Db db)
        {
            // Arrange
            var args = new ResolveItemArgs("/test") { Language = Language.Parse("en"), Database = db.Database };
            partialSut.Configure().WhenForAnyArgs(mock => mock.GetItemByItemManager(default, default, default)).DoNotCallBase();

            // Act
            var result = partialSut.ResolveFullPath(args);

            // Assert
            result.Should().BeNull();
            partialSut.DidNotReceiveWithAnyArgs().GetItemByItemManager(default, default, default);
        }

        [Theory]
        [AutoDbData]
        public void ResolveFullPath_ValidArgsFailsToResolveRootItemByManager_ReturnsNull(Db db)
        {
            // Arrange
            var args = new ResolveItemArgs("/test/with/a/full/path") { Language = Language.Parse("en"), Database = db.Database };
            partialSut.Configure().WhenForAnyArgs(mock => mock.GetItemByItemManager(default, default, default)).DoNotCallBase();
            partialSut.Configure().GetItemByItemManager(default, default, default).ReturnsForAnyArgs(null as Item);

            // Act
            var result = partialSut.ResolveFullPath(args);

            // Assert
            result.Should().BeNull();
            partialSut.ReceivedWithAnyArgs().GetItemByItemManager(default, default, default);
        }

        [Theory]
        [AutoDbData]
        public void ResolveFullPath_ValidArgsWithRootItemOnSuccessfulResolving_ReturnsResolvedItem(Db db, Item rootItem, Item item)
        {
            // Arrange
            var args = new ResolveItemArgs("/test/with/a/full/path") { Language = Language.Parse("en"), Database = db.Database };
            var resolverMock = Substitute.For<ContentItemPathResolver>();
            resolverMock.Configure().WhenForAnyArgs(mock => mock.ResolveItem(default, default)).DoNotCallBase();
            resolverMock.Configure().ResolveItem(default, default).ReturnsForAnyArgs(item);
            partialSut.PathResolver = resolverMock;

            partialSut.Configure().WhenForAnyArgs(mock => mock.GetItemByItemManager(default, default, default)).DoNotCallBase();
            partialSut.Configure().GetItemByItemManager(default, default, default).ReturnsForAnyArgs(rootItem);

            // Act
            var result = partialSut.ResolveFullPath(args);

            // Assert
            result.Should().BeEquivalentTo(item);
            partialSut.ReceivedWithAnyArgs().GetItemByItemManager(default, default, default);
            resolverMock.ReceivedWithAnyArgs(1).ResolveItem(default, default); // 1, as 2 would mean that the initial resolving attempt failed.
        }

        [Theory]
        [AutoDbData]
        public void ResolveFullPath_ValidArgsWithRootItemOnFailedResolving_MakesAnotherAttempt(Db db, Item rootItem, Item item)
        {
            // Arrange
            var args = new ResolveItemArgs("/test/with/a/full/path") { Language = Language.Parse("en"), Database = db.Database };
            var resolverMock = Substitute.For<ContentItemPathResolver>();
            resolverMock.Configure().WhenForAnyArgs(mock => mock.ResolveItem(default, default)).DoNotCallBase();
            resolverMock.Configure().ResolveItem(default, default).ReturnsForAnyArgs(x => null, x => item);
            partialSut.PathResolver = resolverMock;

            partialSut.Configure().WhenForAnyArgs(mock => mock.GetItemByItemManager(default, default, default)).DoNotCallBase();
            partialSut.Configure().GetItemByItemManager(default, default, default).ReturnsForAnyArgs(rootItem);

            // Act
            var result = partialSut.ResolveFullPath(args);

            // Assert
            result.Should().BeEquivalentTo(item);
            partialSut.ReceivedWithAnyArgs().GetItemByItemManager(default, default, default);
            resolverMock.ReceivedWithAnyArgs(2).ResolveItem(default, default); // 1, as 2 would mean that the initial resolving attempt failed.
        }
    }
}