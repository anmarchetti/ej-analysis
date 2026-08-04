using System;
using System.Collections.Generic;
using easyJet.Feature.Redirects.Events;
using easyJet.Feature.Redirects.Logging;
using easyJet.Feature.Redirects.Models;
using easyJet.Feature.Redirects.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore;
using Sitecore.Abstractions;
using Sitecore.Data;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;
using Sitecore.Events;
using Sitecore.FakeDb;
using Sitecore.NSubstituteUtils;
using Xunit;
using DestinationsConstants = easyJet.Foundation.Destinations.Constants;

namespace easyJet.Feature.Redirects.Tests.Events
{
    public class HotelRenameRedirectEventHandlerTests
    {
        private const string OldHotelUrl = "https://www.easyjet.com/en/hotels/spain/Ocean-View-Hotel/";
        private const string NewHotelUrl = "https://www.easyjet.com/en/hotels/spain/Sunshine-Palace";

        private readonly IRedirectRuleManagementService managementService;
        private readonly BaseLinkManager linkManager;
        private readonly BaseFactory factory;
        private readonly IRedirectsLogger logger;
        private readonly HotelRenameRedirectEventHandler handler;

        public HotelRenameRedirectEventHandlerTests()
        {
            managementService = Substitute.For<IRedirectRuleManagementService>();
            linkManager = Substitute.For<BaseLinkManager>();
            factory = Substitute.For<BaseFactory>();
            logger = Substitute.For<IRedirectsLogger>();
            handler = new HotelRenameRedirectEventHandler(managementService, linkManager, factory, logger);
        }

        [Fact]
        public void OnItemSaved_ShouldCreateAwaitingPublishRedirect_WhenHotelDisplayNameChanged()
        {
            // Arrange
            using (var db = new Db())
            {
                var (masterItem, webItem) = CreateHotelItems(db);
                linkManager.GetItemUrl(webItem).Returns(OldHotelUrl);
                linkManager.GetItemUrl(masterItem).Returns(NewHotelUrl);

                RedirectRuleInput captured = null;
                managementService
                    .UpsertRule(Arg.Any<Database>(), Arg.Do<RedirectRuleInput>(input => captured = input), out Arg.Any<bool>(), out Arg.Any<string>())
                    .Returns(call =>
                    {
                        call[2] = true;
                        return new RedirectRuleItem();
                    });

                // Act
                handler.OnItemSaved(this, CreateSavedEventArgs(masterItem));

                // Assert
                managementService.Received(1).UpsertRule(masterItem.Database, Arg.Any<RedirectRuleInput>(), out Arg.Any<bool>(), out Arg.Any<string>());
                captured.Should().NotBeNull();
                captured.FromUrl.Should().Be("/en/hotels/spain/ocean-view-hotel");
                captured.ToUrl.Should().Be("/en/hotels/spain/sunshine-palace");
                captured.RedirectType.Should().Be(301);
                captured.Status.Should().Be(RedirectRuleStatus.AwaitingPublish);
                captured.GroupName.Should().Be("Hotel redirects - 301");
                captured.RelatedItem.Should().Be(masterItem.ID.ToString());
                captured.Languages.Should().Be(masterItem.Language.Name);
                captured.Comments.Should().Contain(masterItem.ID.ToString());
                logger.Received(1).Info(Arg.Any<string>(), handler);
            }
        }

        [Fact]
        public void OnItemSaved_ShouldGenerateUrlsWithinWebItemSiteContext()
        {
            // Arrange
            using (var db = new Db())
            {
                var (masterItem, webItem) = CreateHotelItems(db);
                var siteBefore = Context.Site;
                var sitesDuringUrlGeneration = new List<string>();
                linkManager.GetItemUrl(Arg.Any<Item>()).Returns(call =>
                {
                    sitesDuringUrlGeneration.Add(Context.Site?.Name);
                    return ReferenceEquals(call.Arg<Item>(), webItem) ? OldHotelUrl : NewHotelUrl;
                });

                // Act
                handler.OnItemSaved(this, CreateSavedEventArgs(masterItem));

                // Assert
                // The web item lives under /sitecore/content, which the test app.config maps to the "website" site.
                sitesDuringUrlGeneration.Should().Equal("website", "website");
                Context.Site.Should().Be(siteBefore);
            }
        }

        [Fact]
        public void OnItemSaved_ShouldSkip_WhenItemIsNotHotel()
        {
            // Arrange
            using (var db = new Db())
            {
                var itemId = ID.NewID;
                db.Add(new DbItem("not-a-hotel", itemId, ID.NewID));
                var item = db.GetItem(itemId);

                // Act
                handler.OnItemSaved(this, CreateSavedEventArgs(item));

                // Assert
                AssertNoRedirectCreated();
            }
        }

        [Fact]
        public void OnItemSaved_ShouldSkip_WhenItemSavedInWebDatabase()
        {
            // Arrange
            using (var db = new Db("web"))
            {
                var itemId = ID.NewID;
                db.Add(new DbItem("sunshine-palace", itemId, DestinationsConstants.TemplateIds.Accommodation));
                var item = db.GetItem(itemId);

                // Act
                handler.OnItemSaved(this, CreateSavedEventArgs(item));

                // Assert
                AssertNoRedirectCreated();
            }
        }

        [Fact]
        public void OnItemSaved_ShouldSkip_WhenDisplayNameNotChanged()
        {
            // Arrange
            using (var db = new Db())
            {
                var (masterItem, _) = CreateHotelItems(db);
                var changes = new ItemChanges(masterItem);
                changes.SetFieldValue(new Field(ID.NewID, masterItem), "unrelated field change");
                var args = new SitecoreEventArgs("item:saved", new object[] { masterItem, changes }, new EventResult());

                // Act
                handler.OnItemSaved(this, args);

                // Assert
                AssertNoRedirectCreated();
            }
        }

        [Fact]
        public void OnItemSaved_ShouldSkip_WhenWebItemNotFound()
        {
            // Arrange
            using (var db = new Db())
            {
                var itemId = ID.NewID;
                db.Add(new DbItem("sunshine-palace", itemId, DestinationsConstants.TemplateIds.Accommodation));
                var item = db.GetItem(itemId);
                var webDatabase = FakeUtil.FakeDatabase();
                factory.GetDatabase("web").Returns(webDatabase);

                // Act
                handler.OnItemSaved(this, CreateSavedEventArgs(item));

                // Assert
                AssertNoRedirectCreated();
                linkManager.DidNotReceive().GetItemUrl(Arg.Any<Item>());
            }
        }

        [Fact]
        public void OnItemSaved_ShouldSkip_WhenRenameIsCoveredByDestinationsRedirect()
        {
            // Arrange
            using (var db = new Db())
            {
                // The item name already matches the published display name slug, so the generic
                // ^(/destinations)(.*)$ -> $2 redirect covers it and no rule should be created.
                var (masterItem, _) = CreateHotelItems(db, masterName: "ocean-view-hotel");

                // Act
                handler.OnItemSaved(this, CreateSavedEventArgs(masterItem));

                // Assert
                AssertNoRedirectCreated();
            }
        }

        [Theory]
        [InlineData("", NewHotelUrl)]
        [InlineData(OldHotelUrl, "")]
        [InlineData("https://www.easyjet.com/en/hotels/spain/Ocean-View-Hotel/", "/en/hotels/spain/ocean-view-hotel")]
        public void OnItemSaved_ShouldSkip_WhenUrlsAreEmptyOrEquivalent(string oldUrl, string newUrl)
        {
            // Arrange
            using (var db = new Db())
            {
                var (masterItem, webItem) = CreateHotelItems(db);
                linkManager.GetItemUrl(webItem).Returns(oldUrl);
                linkManager.GetItemUrl(masterItem).Returns(newUrl);

                // Act
                handler.OnItemSaved(this, CreateSavedEventArgs(masterItem));

                // Assert
                AssertNoRedirectCreated();
            }
        }

        [Fact]
        public void OnItemSaved_ShouldLogWarning_WhenUpsertRuleFails()
        {
            // Arrange
            using (var db = new Db())
            {
                var (masterItem, webItem) = CreateHotelItems(db);
                linkManager.GetItemUrl(webItem).Returns(OldHotelUrl);
                linkManager.GetItemUrl(masterItem).Returns(NewHotelUrl);
                managementService
                    .UpsertRule(Arg.Any<Database>(), Arg.Any<RedirectRuleInput>(), out Arg.Any<bool>(), out Arg.Any<string>())
                    .Returns(call =>
                    {
                        call[3] = "upsert failed";
                        return null;
                    });

                // Act
                handler.OnItemSaved(this, CreateSavedEventArgs(masterItem));

                // Assert
                logger.Received(1).Warn(Arg.Is<string>(message => message.Contains("upsert failed")), handler);
                logger.DidNotReceive().Info(Arg.Any<string>(), Arg.Any<object>());
            }
        }

        [Fact]
        public void OnItemSaved_ShouldLogError_WhenExceptionIsThrown()
        {
            // Arrange
            using (var db = new Db())
            {
                var (masterItem, webItem) = CreateHotelItems(db);
                linkManager.GetItemUrl(webItem).Returns(OldHotelUrl);
                linkManager.GetItemUrl(masterItem).Returns(NewHotelUrl);
                var exception = new InvalidOperationException("boom");
                managementService
                    .UpsertRule(Arg.Any<Database>(), Arg.Any<RedirectRuleInput>(), out Arg.Any<bool>(), out Arg.Any<string>())
                    .Returns(call => throw exception);

                // Act
                Action act = () => handler.OnItemSaved(this, CreateSavedEventArgs(masterItem));

                // Assert
                act.Should().NotThrow();
                logger.Received(1).Error(Arg.Any<string>(), exception, handler);
            }
        }

        private static SitecoreEventArgs CreateSavedEventArgs(Item item)
        {
            var changes = new ItemChanges(item);
            changes.SetFieldValue(new Field(FieldIDs.DisplayName, item), "Sunshine Palace");
            return new SitecoreEventArgs("item:saved", new object[] { item, changes }, new EventResult());
        }

        private (Item MasterItem, Item WebItem) CreateHotelItems(
            Db db,
            string masterName = "sunshine-palace",
            string webDisplayName = "Ocean View Hotel")
        {
            var masterId = ID.NewID;
            var webId = ID.NewID;
            db.Add(new DbItem(masterName, masterId, DestinationsConstants.TemplateIds.Accommodation));
            db.Add(new DbItem("published-hotel", webId, DestinationsConstants.TemplateIds.Accommodation)
            {
                { FieldIDs.DisplayName, webDisplayName }
            });

            var masterItem = db.GetItem(masterId);
            var webItem = db.GetItem(webId);

            var webDatabase = FakeUtil.FakeDatabase();
            webDatabase.GetItem(masterItem.ID, masterItem.Language).Returns(webItem);
            factory.GetDatabase("web").Returns(webDatabase);

            return (masterItem, webItem);
        }

        private void AssertNoRedirectCreated()
        {
            managementService.DidNotReceive().UpsertRule(Arg.Any<Database>(), Arg.Any<RedirectRuleInput>(), out Arg.Any<bool>(), out Arg.Any<string>());
        }
    }
}
