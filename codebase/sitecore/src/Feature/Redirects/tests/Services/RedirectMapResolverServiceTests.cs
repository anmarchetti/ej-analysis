using AutoFixture.Xunit2;
using easyJet.Feature.Redirects.Models;
using easyJet.Feature.Redirects.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.Abstractions;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Feature.Redirects.Tests.Services
{
    public class RedirectMapResolverServiceTests
    {
        private readonly RedirectMapResolverService service;
        private readonly BaseLinkManager linkManager;
        private readonly IRedirectRuleMatcher redirectRuleMatcher;

        public RedirectMapResolverServiceTests()
        {
            linkManager = Substitute.For<BaseLinkManager>();
            redirectRuleMatcher = Substitute.For<IRedirectRuleMatcher>();
            service = new RedirectMapResolverService(linkManager, redirectRuleMatcher);
        }

        private static Item CreateItem(ID itemId, Database database)
        {
            return new FakeItem(itemId, database).WithItemVersions().ToSitecoreItem();
        }

        private static Item CreateHotelItem(ID itemId, Database database)
        {
            return new FakeItem(itemId, database).WithTemplate(easyJet.Foundation.Destinations.Constants.TemplateIds.Accommodation).WithItemVersions().ToSitecoreItem();
        }

        [Fact]
        public void GetRedirectData_ShouldBeNull_IfItemIsNull()
        {
            // Act
            var actual = service.GetRedirectData(null);

            // Assert
            actual.Should().BeNull();
        }

        [Theory]
        [AutoData]
        public void GetRedirectData_ShouldBeNull_IfNoRedirectRules(string url)
        {
            // Arrange
            var database = FakeUtil.FakeDatabase();
            Item item = CreateItem(ID.NewID, database);
            linkManager.GetItemUrl(Arg.Any<Item>()).Returns(url);
            redirectRuleMatcher.FindMatch(Arg.Any<string>(), database, item.TemplateID, item.Language).Returns((RedirectRuleMatchResult)null);

            // Act
            var actual = service.GetRedirectData(item);

            // Assert
            actual.Should().BeNull();
        }

        [Fact]
        public void GetRedirectData_ShouldReturnRedirectData_WhenMatchFound()
        {
            // Arrange
            var database = FakeUtil.FakeDatabase();
            Item item = CreateItem(ID.NewID, database);
            linkManager.GetItemUrl(Arg.Any<Item>()).Returns("/destinations/spain");
            redirectRuleMatcher.FindMatch(Arg.Any<string>(), database, item.TemplateID, item.Language)
                .Returns(new RedirectRuleMatchResult
                {
                    RedirectType = 302,
                    ToUrl = "/spain"
                });

            // Act
            var actual = service.GetRedirectData(item);

            // Assert
            actual.Should().NotBeNull();
            actual.RedirectType.Should().Be(302);
            actual.RedirectUrl.Should().Be("/spain");
        }

        [Fact]
        public void GetRedirectData_ShouldReturnNull_WhenStringUrlMissing()
        {
            var actual = service.GetRedirectData(string.Empty);

            actual.Should().BeNull();
        }

        [Fact]
        public void GetRedirectData_ShouldReturnRedirectData_ForStringUrl()
        {
            redirectRuleMatcher.FindMatch(Arg.Any<string>(), Arg.Any<Sitecore.Data.Database>(), Arg.Any<Sitecore.Data.ID>())
                .Returns(new RedirectRuleMatchResult
                {
                    RedirectType = 301,
                    ToUrl = "/match"
                });

            var database = FakeUtil.FakeDatabase();
            Sitecore.Context.Database = database;

            var actual = service.GetRedirectData("/from", Sitecore.Data.ID.NewID);

            actual.Should().NotBeNull();
            actual.RedirectType.Should().Be(301);
            actual.RedirectUrl.Should().Be("/match");
        }

        [Fact]
        public void GetRedirectData_ShouldUseItemUrl_WhenRedirectTargetDoesNotMatch()
        {
            // Arrange
            var relatedId = ID.NewID;
            var database = FakeUtil.FakeDatabase();
            var item = CreateHotelItem(relatedId, database);
            database.GetItem(relatedId).Returns(item);
            linkManager.GetItemUrl(item).Returns("/spain/new-hotel");
            redirectRuleMatcher.FindMatch(
                    Arg.Is<string>(url => url == "/spain/new-hotel"),
                    database,
                    item.TemplateID,
                    item.Language)
                .Returns(new RedirectRuleMatchResult
                {
                    RedirectType = 301,
                    FromUrl = "/spain/new-hotel",
                    ToUrl = string.Empty,
                    Status = RedirectRuleStatus.AwaitingPublish,
                    RelatedItemId = relatedId
                });

            // Act
            var actual = service.GetRedirectData(item);

            // Assert
            actual.Should().NotBeNull();
            actual.RedirectType.Should().Be(301);
            actual.RedirectUrl.Should().Be("/spain/new-hotel");
        }

        [Fact]
        public void GetRedirectData_ShouldReturnNull_WhenRelatedItemDoesNotMatch()
        {
            // Arrange
            var relatedId = ID.NewID;
            var database = FakeUtil.FakeDatabase();
            var item = CreateHotelItem(relatedId, database);
            database.GetItem(relatedId).Returns(item);
            linkManager.GetItemUrl(item).Returns("/spain/old-hotel");
            redirectRuleMatcher.FindMatch(
                    Arg.Is<string>(url => url == "/spain/old-hotel"),
                    database,
                    item.TemplateID,
                    item.Language)
                .Returns(new RedirectRuleMatchResult
                {
                    RedirectType = 301,
                    FromUrl = "/spain/old-hotel",
                    ToUrl = string.Empty,
                    Status = RedirectRuleStatus.AwaitingPublish,
                    RelatedItemId = ID.NewID
                });

            // Act
            var actual = service.GetRedirectData(item);

            // Assert
            actual.Should().BeNull();
        }

        [Fact]
        public void GetRedirectData_ShouldUseToUrl_WhenStatusIsActive()
        {
            // Arrange
            var database = FakeUtil.FakeDatabase();
            redirectRuleMatcher.FindMatch(Arg.Any<string>(), Arg.Any<Sitecore.Data.Database>(), Arg.Any<Sitecore.Data.ID>())
                .Returns(new RedirectRuleMatchResult
                {
                    RedirectType = 301,
                    ToUrl = "/spain/new-hotel",
                    Status = RedirectRuleStatus.Active,
                    RelatedItemId = Sitecore.Data.ID.NewID
                });
            Sitecore.Context.Database = database;

            // Act
            var actual = service.GetRedirectData("/spain/old-hotel", Sitecore.Data.ID.NewID);

            // Assert
            actual.Should().NotBeNull();
            actual.RedirectUrl.Should().Be("/spain/new-hotel");
            database.DidNotReceive().GetItem(Arg.Any<Sitecore.Data.ID>());
        }

        [Fact]
        public void GetRedirectData_ShouldReturnStoredToUrl_ForStringUrlWhenStatusIsAwaitingPublish()
        {
            // Arrange — 404 path uses the string overload and returns stored ToUrl without related-item checks.
            var database = FakeUtil.FakeDatabase();
            redirectRuleMatcher.FindMatch(Arg.Any<string>(), database, Arg.Any<ID>())
                .Returns(new RedirectRuleMatchResult
                {
                    RedirectType = 301,
                    FromUrl = "/spain/old-hotel",
                    ToUrl = "/spain/new-hotel",
                    Status = RedirectRuleStatus.AwaitingPublish,
                    RelatedItemId = ID.NewID
                });
            Sitecore.Context.Database = database;

            // Act
            var actual = service.GetRedirectData("/spain/old-hotel", ID.NewID);

            // Assert
            actual.Should().NotBeNull();
            actual.RedirectUrl.Should().Be("/spain/new-hotel");
            database.DidNotReceive().GetItem(Arg.Any<ID>());
        }
    }
}
