using System.Configuration;
using System.Web.Mvc;
using AutoFixture;
using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.ContentSearch.Fields;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using FluentAssertions;
using NSubstitute;
using Sitecore.Configuration;
using Sitecore.ContentSearch;
using Sitecore.FakeDb;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.ContentSearch.Fields
{
    public class PromoFacilitiesComputedFieldTests
    {
        private readonly Fixture fixture;
        private readonly Db db;
        private readonly PromoFacilitiesComputedField computedField;

        public PromoFacilitiesComputedFieldTests()
        {
            fixture = new Fixture();
            db = fixture.Freeze<Db>();

            computedField = new PromoFacilitiesComputedField(new ConfigXmlDocument());
        }

        [Fact]
        public void IsValid_ShouldBeTrue_IfItemIsAccommodation()
        {
            // Arrange
            var item = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            item.TemplateID = Constants.TemplateIds.Accommodation;

            db.Add(item);

            var indexableItem = new SitecoreIndexableItem(db.GetItem(item.ID));

            // Act
            var actual = computedField.IsValid(indexableItem);

            // Assert
            actual.Should().BeTrue();
        }

        [Theory]
        [AutoData]
        public void ComputeField_ShouldNotBeNull_IfPromoFacilityExists(string fakeTitle, string fakeDescription)
        {
            // Arrange
            var item = fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            var pageComponentsFolder = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            pageComponentsFolder.TemplateID = Constants.TemplateIds.PageComponentsFolder;
            item.Children.Add(pageComponentsFolder);

            var promoBlocksFolder = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            promoBlocksFolder.TemplateID = Constants.TemplateIds.PromoBlocksFolder;

            promoBlocksFolder.Fields.Add(Constants.Fields.PromoBlocksFolder.FeaturedFacilities, "1");

            pageComponentsFolder.Children.Add(promoBlocksFolder);

            var promoBlock = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            promoBlock.TemplateID = Constants.TemplateIds.PromoBlock;

            var linkField = new DbField(Constants.Fields.PromoBlock.Link)
            {
                Type = "LinkField",
                Value = "<link text='fakeAnchor' anchor='fakeAnchor' linktype='internal' id='{BC63FD1F-B7CB-4114-A6A9-591332D9203C}' />"
            };

            promoBlock.Fields.Add(Constants.Fields.PromoBlock.Title, fakeTitle);
            promoBlock.Fields.Add(Constants.Fields.PromoBlock.Description, fakeDescription);
            promoBlock.Fields.Add(linkField);

            promoBlocksFolder.Children.Add(promoBlock);

            db.Add(item);

            var indexableItem = new SitecoreIndexableItem(db.GetItem(item.ID));

            // Act
            using (new SettingsSwitcher("Destinations.SiteContextName", "Holidays"))
            {
                var actual = computedField.ComputeField(indexableItem);

                // Assert
                actual.Should().NotBeNull();
            }
        }

        [Fact]
        public void ComputeField_ShouldBeNull_IfPromoblockFolderNotExist()
        {
            // Arrange
            var item = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            db.Add(item);

            var indexableItem = new SitecoreIndexableItem(db.GetItem(item.ID));

            // Act
            using (new SettingsSwitcher("Destinations.SiteContextName", "Holidays"))
            {
                var actual = computedField.ComputeField(indexableItem);

                // Assert
                actual.Should().BeNull();
            }
        }
    }
}
