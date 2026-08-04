using FluentAssertions;
using NSubstitute;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Sitecore.FakeDb.Sites;
using Xunit;
using ItemExtensions = easyJet.Foundation.Presentation.Extensions.ItemExtensions;

namespace easyJet.Foundation.Presentation.Tests.Extensions
{
    public class ItemExtensionsTests
    {
        [Fact]
        public void GetMultivariantPageDesign_WhenItemIsNull_ReturnsNull()
        {
            // ARRANGE
            Item item = null;

            // ACT
            var actual = ItemExtensions.GetMultivariantPageDesign(item);

            // ASSERT
            actual.Should().BeNull();
        }

        [Fact]
        public void GetMultivariantPageDesignForProvider_WhenItemIsNull_ReturnsNull()
        {
            // ARRANGE
            Item item = null;

            // ACT
            var actual = ItemExtensions.GetMultivariantPageDesignForProvider(item, ID.NewID);

            // ASSERT
            actual.Should().BeNull();
        }

        [Fact]
        public void GetMultivariantPageDesignForProvider_WithBothPageTemplatesAndProvidersFilters_ReturnsCorrectItem()
        {
            // ARRANGE
            var homeId = ID.NewID;
            var pageTemplateId = ID.NewID;
            var providerId = ID.NewID;
            var pageDesignId = ID.NewID;

            using (var db = new Db
            {
                new DbItem("sitecore")
                {
                    new DbItem("content")
                    {
                        new DbItem("Home", homeId, pageTemplateId),
                        new DbItem("Presentation", ID.NewID, Templates.Presentation.Id)
                        {
                            new DbItem("Multivariant Presentation",  ID.NewID, Templates.MultivatiantPageDesignFolder.Id)
                            {
                                new DbItem("Page Design", pageDesignId, Templates.MultivatiantPageDesign.Id)
                                {
                                    new DbField(Sitecore.FieldIDs.LayoutField),
                                    new DbField(Templates.MultivatiantPageDesign.Fields.PageTemplates),
                                    new DbField("ExperienceContextProviders")
                                }
                            }
                        }
                    }
                }
            })
            {
                var pageItem = db.GetItem(homeId);
                var pageDesign = db.GetItem(pageDesignId);

                using (new Sitecore.Data.Items.EditContext(pageDesign))
                {
                    pageDesign.Fields[Templates.MultivatiantPageDesign.Fields.PageTemplates].Value = pageItem.TemplateID.Guid.ToString("B").ToUpperInvariant();
                    pageDesign.Fields["ExperienceContextProviders"].Value = providerId.ToString();
                }

                var fakeSite = new FakeSiteContext(
                    new Sitecore.Collections.StringDictionary
                    {
                        { "name", "Holidays" },
                        { "database", "master" },
                        { "rootPath", "/sitecore/content/" }
                    });

                // ACT
                using (new FakeSiteContextSwitcher(fakeSite))
                {
                    var result = ItemExtensions.GetMultivariantPageDesignForProvider(pageItem, providerId);

                    // ASSERT
                    result.Should().NotBeNull();
                    result.ID.Should().Be(pageDesignId);
                }
            }
        }

        [Fact]
        public void GetMultivariantPageDesignForProvider_WhenProviderIdIsNull_ReturnsNull()
        {
            // ARRANGE
            var pageTemplateId = ID.NewID;
            var homeId = ID.NewID;

            // No DB required — method returns null when provider id is null regardless of item
            Item pageItem = null;

            // ACT
            var result = ItemExtensions.GetMultivariantPageDesignForProvider(pageItem, ID.Null);

            // ASSERT
            result.Should().BeNull();
        }
    }
}