using AutoFixture;
using FluentAssertions;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Xunit;

namespace easyJet.Foundation.Multisite.Tests
{
    public class MultiSiteContextTests
    {
        private readonly Fixture fixture;
        private readonly Db db;
        private readonly MultiSiteContext multiSiteContext;

        public MultiSiteContextTests()
        {
            fixture = new Fixture();
            db = fixture.Freeze<Db>();
            multiSiteContext = new MultiSiteContext();
        }

        [Fact]
        public void TenantItem_ShouldReturnParentItem_IfParentItemHasSpecificTemplate()
        {
            // Arrange
            var parentItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            parentItem.TemplateID = Templates.Tenant.Id;

            var item = fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            parentItem.Children.Add(item);

            db.Add(parentItem);

            // Act
            using (new ContextItemSwitcher(db.GetItem(item.ID)))
            {
                var actual = multiSiteContext.TenantItem;

                // Assert
                actual.ID.Should().BeEquivalentTo(parentItem.ID);
            }
        }

        [Fact]
        public void GetTenantItem_ShouldReturnParentItem_IfParentItemHasSpecificTemplate()
        {
            // Arrange
            var parentItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            parentItem.TemplateID = Templates.Tenant.Id;

            var item = fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            parentItem.Children.Add(item);

            db.Add(parentItem);

            // Act
            var actual = multiSiteContext.GetTenantItem(db.GetItem(item.ID));

            // Assert
            actual.ID.Should().BeEquivalentTo(parentItem.ID);
        }

        [Fact]
        public void SiteItem_ShouldReturnParentItem_IfParentItemHasSpecificTemplate()
        {
            // Arrange
            var parentItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            parentItem.TemplateID = Templates.Site.Id;

            var item = fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            parentItem.Children.Add(item);

            db.Add(parentItem);

            // Act
            using (new ContextItemSwitcher(db.GetItem(item.ID)))
            {
                var actual = multiSiteContext.SiteItem;

                // Assert
                actual.ID.Should().BeEquivalentTo(parentItem.ID);
            }
        }

        [Fact]
        public void GetSiteItem_ShouldReturnParentItem_IfParentItemHasSpecificTemplate()
        {
            // Arrange
            var parentItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            parentItem.TemplateID = Templates.Site.Id;

            var item = fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            parentItem.Children.Add(item);

            db.Add(parentItem);

            // Act
            var actual = multiSiteContext.GetSiteItem(db.GetItem(item.ID));

            // Assert
            actual.ID.Should().BeEquivalentTo(parentItem.ID);
        }

        [Fact]
        public void DataItem_ShouldReturnItem_IfItemWithDataTemplateExist()
        {
            // Arrange
            var siteItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            siteItem.TemplateID = Templates.Site.Id;

            var dataItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            dataItem.TemplateID = Templates.Data.Id;

            var item = fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            siteItem.Children.Add(dataItem);
            siteItem.Children.Add(item);

            db.Add(siteItem);

            // Act
            using (new ContextItemSwitcher(db.GetItem(item.ID)))
            {
                var actual = multiSiteContext.DataItem;

                // Assert
                actual.ID.Should().BeEquivalentTo(dataItem.ID);
            }
        }

        [Fact]
        public void GetDataItem_ShouldReturnItem_IfItemWithDataTemplateExist()
        {
            // Arrange
            var siteItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            siteItem.TemplateID = Templates.Site.Id;

            var dataItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            dataItem.TemplateID = Templates.Data.Id;

            var item = fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            siteItem.Children.Add(dataItem);
            siteItem.Children.Add(item);

            db.Add(siteItem);

            // Act
            var actual = multiSiteContext.GetDataItem(db.GetItem(item.ID));

            // Assert
            actual.ID.Should().BeEquivalentTo(dataItem.ID);
        }

        [Fact]
        public void SettingsItem_ShouldReturnItem_IfItemWithSettingsTemplateExist()
        {
            // Arrange
            var siteItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            siteItem.TemplateID = Templates.Site.Id;

            var settingsItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            settingsItem.TemplateID = Templates.Settings.Id;

            var item = fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            siteItem.Children.Add(settingsItem);
            siteItem.Children.Add(item);

            db.Add(siteItem);

            // Act
            using (new ContextItemSwitcher(db.GetItem(item.ID)))
            {
                var actual = multiSiteContext.SettingsItem;

                // Assert
                actual.ID.Should().BeEquivalentTo(settingsItem.ID);
            }
        }

        [Fact]
        public void GetSettingsItem_ShouldReturnItem_IfItemWithSettingsTemplateExist()
        {
            // Arrange
            var siteItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            siteItem.TemplateID = Templates.Site.Id;

            var settingsItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            settingsItem.TemplateID = Templates.Settings.Id;

            var item = fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            siteItem.Children.Add(settingsItem);
            siteItem.Children.Add(item);

            db.Add(siteItem);

            // Act
            var actual = multiSiteContext.GetSettingsItem(db.GetItem(item.ID));

            // Assert
            actual.ID.Should().BeEquivalentTo(settingsItem.ID);
        }

        [Fact]
        public void SiteMediaItem_ShouldReturnItem_IfItemWithMediaTemplateExist()
        {
            // Arrange
            var siteItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            siteItem.TemplateID = Templates.Site.Id;

            var mediaItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            mediaItem.TemplateID = Templates.Media.Id;

            var item = fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            siteItem.Children.Add(mediaItem);
            siteItem.Children.Add(item);

            db.Add(siteItem);

            // Act
            using (new ContextItemSwitcher(db.GetItem(item.ID)))
            {
                var actual = multiSiteContext.SiteMediaItem;

                // Assert
                actual.ID.Should().BeEquivalentTo(mediaItem.ID);
            }
        }

        [Fact]
        public void GetSiteMediaItem_ShouldReturnItem_IfItemWithMediaTemplateExist()
        {
            // Arrange
            var siteItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            siteItem.TemplateID = Templates.Site.Id;

            var mediaItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            mediaItem.TemplateID = Templates.Media.Id;

            var item = fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            siteItem.Children.Add(mediaItem);
            siteItem.Children.Add(item);

            db.Add(siteItem);

            // Act
            var actual = multiSiteContext.GetSiteMediaItem(db.GetItem(item.ID));

            // Assert
            actual.ID.Should().BeEquivalentTo(mediaItem.ID);
        }

        [Fact]
        public void HomeItem_ShouldReturnItem_IfItemWithHomeTemplateExist()
        {
            // Arrange
            var siteItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            siteItem.TemplateID = Templates.Site.Id;

            var homeItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            homeItem.TemplateID = Templates.Home.Id;

            var item = fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            siteItem.Children.Add(homeItem);
            siteItem.Children.Add(item);

            db.Add(siteItem);

            // Act
            using (new ContextItemSwitcher(db.GetItem(item.ID)))
            {
                var actual = multiSiteContext.HomeItem;

                // Assert
                actual.ID.Should().BeEquivalentTo(homeItem.ID);
            }
        }

        [Fact]
        public void GetHomeItem_ShouldReturnItem_IfItemWithHomeTemplateExist()
        {
            // Arrange
            var siteItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            siteItem.TemplateID = Templates.Site.Id;

            var homeItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            homeItem.TemplateID = Templates.Home.Id;

            var item = fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            siteItem.Children.Add(homeItem);
            siteItem.Children.Add(item);

            db.Add(siteItem);

            // Act
            var actual = multiSiteContext.GetHomeItem(db.GetItem(item.ID));

            // Assert
            actual.ID.Should().BeEquivalentTo(homeItem.ID);
        }

        [Fact]
        public void GetHomeItem_ShouldReturnNull_IfItemWithSiteTemplateNotExist()
        {
            // Arrange
            var item = fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            db.Add(item);

            // Act
            var actual = multiSiteContext.GetHomeItem(db.GetItem(item.ID));

            // Assert
            actual.Should().BeNull();
        }
    }
}
