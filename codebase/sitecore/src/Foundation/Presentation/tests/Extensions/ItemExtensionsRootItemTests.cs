using System;
using System.Collections.Generic;
using easyJet.Foundation.Presentation.Logging;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.NSubstituteUtils;
using Xunit;
using ItemExtensions = easyJet.Foundation.Presentation.Extensions.ItemExtensions;

namespace easyJet.Foundation.Presentation.Tests.Extensions
{
    public class ItemExtensionsRootItemTests
    {
        private const string ContextPath = "/sitecore/content/Holidays/Home/Deals/Spain";

        [Fact]
        public void SelectDeepestRootItemMatch_WhenContextItemIsNull_ReturnsNull()
        {
            // ARRANGE
            var logger = Substitute.For<IPresentationLogger>();

            // ACT
            var actual = ItemExtensions.SelectDeepestRootItemMatch(null, new List<Item>(), logger);

            // ASSERT
            actual.Should().BeNull();
        }

        [Fact]
        public void SelectDeepestRootItemMatch_WhenNoCandidates_ReturnsNull()
        {
            // ARRANGE
            var database = FakeUtil.FakeDatabase();
            var context = new FakeItem(ID.NewID, database).WithPath(ContextPath).ToSitecoreItem();
            var logger = Substitute.For<IPresentationLogger>();

            // ACT
            var actual = ItemExtensions.SelectDeepestRootItemMatch(context, new List<Item>(), logger);

            // ASSERT
            actual.Should().BeNull();
        }

        [Fact]
        public void SelectDeepestRootItemMatch_WhenSingleDesignWithEmptyRootItem_ReturnsThatDesign()
        {
            // ARRANGE
            var database = FakeUtil.FakeDatabase();
            var context = new FakeItem(ID.NewID, database).WithPath(ContextPath).ToSitecoreItem();
            var design = CreateDesign(database, "Default", rootItemPath: null);
            var logger = Substitute.For<IPresentationLogger>();

            // ACT
            var actual = ItemExtensions.SelectDeepestRootItemMatch(context, new[] { design }, logger);

            // ASSERT
            actual.ID.Should().Be(design.ID);
        }

        [Fact]
        public void SelectDeepestRootItemMatch_WhenSeveralMatch_ReturnsDeepestRootItem()
        {
            // ARRANGE
            var database = FakeUtil.FakeDatabase();
            var context = new FakeItem(ID.NewID, database).WithPath(ContextPath).ToSitecoreItem();
            var fallback = CreateDesign(database, "Fallback", rootItemPath: null);
            var siteRoot = CreateDesign(database, "SiteRoot", "/sitecore/content/Holidays");
            var deepest = CreateDesign(database, "Deals", "/sitecore/content/Holidays/Home/Deals");
            var logger = Substitute.For<IPresentationLogger>();

            // ACT
            var actual = ItemExtensions.SelectDeepestRootItemMatch(context, new[] { fallback, siteRoot, deepest }, logger);

            // ASSERT
            actual.ID.Should().Be(deepest.ID);
        }

        [Fact]
        public void SelectDeepestRootItemMatch_WhenRootItemEqualsContextPath_MatchesAsSelf()
        {
            // ARRANGE
            var database = FakeUtil.FakeDatabase();
            var context = new FakeItem(ID.NewID, database).WithPath(ContextPath).ToSitecoreItem();
            var selfMatch = CreateDesign(database, "Self", ContextPath);
            var logger = Substitute.For<IPresentationLogger>();

            // ACT
            var actual = ItemExtensions.SelectDeepestRootItemMatch(context, new[] { selfMatch }, logger);

            // ASSERT
            actual.ID.Should().Be(selfMatch.ID);
        }

        [Fact]
        public void SelectDeepestRootItemMatch_IgnoresRootItemThatIsNotAncestor()
        {
            // ARRANGE
            var database = FakeUtil.FakeDatabase();
            var context = new FakeItem(ID.NewID, database).WithPath(ContextPath).ToSitecoreItem();
            var otherSite = CreateDesign(database, "TradePortal", "/sitecore/content/TradePortal");
            var fallback = CreateDesign(database, "Fallback", rootItemPath: null);
            var logger = Substitute.For<IPresentationLogger>();

            // ACT
            var actual = ItemExtensions.SelectDeepestRootItemMatch(context, new[] { otherSite, fallback }, logger);

            // ASSERT
            actual.ID.Should().Be(fallback.ID);
        }

        [Fact]
        public void SelectDeepestRootItemMatch_RespectsPathSegmentBoundaries()
        {
            // ARRANGE — "/sitecore/content/Holidays/Home" must not match a sibling "...Home Page"
            var database = FakeUtil.FakeDatabase();
            var context = new FakeItem(ID.NewID, database).WithPath("/sitecore/content/Holidays/Home Page").ToSitecoreItem();
            var nearMiss = CreateDesign(database, "Home", "/sitecore/content/Holidays/Home");
            var logger = Substitute.For<IPresentationLogger>();

            // ACT
            var actual = ItemExtensions.SelectDeepestRootItemMatch(context, new[] { nearMiss }, logger);

            // ASSERT
            actual.Should().BeNull();
        }

        [Fact]
        public void SelectDeepestRootItemMatch_WhenNoRootItemIsAncestor_ReturnsNull()
        {
            // ARRANGE
            var database = FakeUtil.FakeDatabase();
            var context = new FakeItem(ID.NewID, database).WithPath(ContextPath).ToSitecoreItem();
            var otherSite = CreateDesign(database, "TradePortal", "/sitecore/content/TradePortal");
            var logger = Substitute.For<IPresentationLogger>();

            // ACT
            var actual = ItemExtensions.SelectDeepestRootItemMatch(context, new[] { otherSite }, logger);

            // ASSERT
            actual.Should().BeNull();
        }

        [Fact]
        public void SelectDeepestRootItemMatch_WhenTieAtDeepestRootItem_LogsWarningAndReturnsFirst()
        {
            // ARRANGE
            var database = FakeUtil.FakeDatabase();
            var context = new FakeItem(ID.NewID, database).WithPath(ContextPath).ToSitecoreItem();
            var first = CreateDesign(database, "First", "/sitecore/content/Holidays/Home/Deals");
            var second = CreateDesign(database, "Second", "/sitecore/content/Holidays/Home/Deals");
            var logger = Substitute.For<IPresentationLogger>();

            // ACT
            var actual = ItemExtensions.SelectDeepestRootItemMatch(context, new[] { first, second }, logger);

            // ASSERT
            actual.ID.Should().Be(first.ID);
            logger.Received(1).Warn(Arg.Any<string>(), Arg.Any<Type>());
        }

        [Fact]
        public void GetMultivariantPageDesign_WhenItemIsNull_ReturnsNull()
        {
            // ARRANGE / ACT
            var result = ItemExtensions.GetMultivariantPageDesign(null);

            // ASSERT
            result.Should().BeNull();
        }

        [Fact]
        public void GetMultivariantPageDesignForProvider_WhenItemIsNull_ReturnsNull()
        {
            // ARRANGE / ACT
            var result = ItemExtensions.GetMultivariantPageDesignForProvider(null, ID.NewID);

            // ASSERT
            result.Should().BeNull();
        }

        [Fact]
        public void GetMultivariantPageDesignForProvider_WhenProviderIdIsNull_ReturnsNull()
        {
            // ARRANGE
            var database = FakeUtil.FakeDatabase();
            var item = new FakeItem(ID.NewID, database).WithPath(ContextPath).ToSitecoreItem();

            // ACT
            var result = ItemExtensions.GetMultivariantPageDesignForProvider(item, ID.Null);

            // ASSERT
            result.Should().BeNull();
        }

        [Fact]
        public void ResolvePageDesignByRootItem_WhenContextItemIsNull_ReturnsNull()
        {
            // ARRANGE
            var logger = Substitute.For<IPresentationLogger>();

            // ACT
            var result = ItemExtensions.ResolvePageDesignByRootItem(null, "/*[@field='value']", logger);

            // ASSERT
            result.Should().BeNull();
        }

        [Fact]
        public void ResolvePageDesignByRootItem_WhenQueryIsEmpty_ReturnsNull()
        {
            // ARRANGE
            var database = FakeUtil.FakeDatabase();
            var item = new FakeItem(ID.NewID, database).WithPath(ContextPath).ToSitecoreItem();
            var logger = Substitute.For<IPresentationLogger>();

            // ACT
            var result = ItemExtensions.ResolvePageDesignByRootItem(item, string.Empty, logger);

            // ASSERT
            result.Should().BeNull();
        }

        [Fact]
        public void GetPageDesignForProviderQuery_WhenItemIsNull_ReturnsNull()
        {
            // ARRANGE / ACT
            var result = ItemExtensions.GetPageDesignForProviderQuery(null, ID.NewID);

            // ASSERT
            result.Should().BeNull();
        }

        private static Item CreateDesign(Database database, string name, string rootItemPath)
        {
            var design = new FakeItem(ID.NewID, database)
                .WithName(name)
                .WithPath($"/sitecore/content/Holidays/Presentation/Page Designs/{name}");

            if (rootItemPath == null)
            {
                design.WithField(Templates.PageDesign.Fields.RootItem, string.Empty);
            }
            else
            {
                var rootId = ID.NewID;
                var rootItem = new FakeItem(rootId, database).WithPath(rootItemPath).ToSitecoreItem();
                database.GetItem(rootId).Returns(rootItem);
                design.WithField(Templates.PageDesign.Fields.RootItem, rootId.ToString());
            }

            return design.ToSitecoreItem();
        }
    }
}
