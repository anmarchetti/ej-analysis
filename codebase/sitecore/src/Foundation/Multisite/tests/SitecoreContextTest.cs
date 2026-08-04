using AutoFixture.Xunit2;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using FluentAssertions;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Sitecore.FakeDb.Sites;
using Sitecore.Sites;
using Sitecore.Web;
using Xunit;

namespace easyJet.Foundation.Multisite.Tests
{
    public class SitecoreContextTest
    {
        private SitecoreContext sitecoreContext;
        private SiteContext sitecontext;

        public SitecoreContextTest()
        {
            sitecontext = new FakeSiteContext(new Sitecore.Collections.StringDictionary
            {
                { "name", "fake" },
                { "database", "master" },
                { "language", "en" },
                { "rootPath", "/sitecore/content" }
            });
            sitecoreContext = new SitecoreContext
            {
                Site = sitecontext
            };
        }

        [Theory]
        [AutoData]
        public void CheckSitecoreContext(Db db)
        {
            // Arrange
            var dbItem = new DbItem("test", ID.NewID, Foundation.Multisite.Templates.Home.Id);
            db.Add(dbItem);

            // Act
            sitecoreContext.Item = db.GetItem(dbItem.ID);

            // Assert
            sitecoreContext.ContentDatabase.Should().NotBeNull();
            sitecoreContext.Database.Should().NotBeNull();
            sitecoreContext.Item.ID.Should().BeEquivalentTo(dbItem.ID);
            sitecoreContext.Site.Should().NotBeNull();
        }
    }
}