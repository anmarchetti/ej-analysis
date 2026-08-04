using System;
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
    public class ResortDescriptionComputedFieldTests
    {
        private readonly Fixture fixture;
        private readonly Db db;
        private readonly ResortDescriptionComputedField computedField;

        public ResortDescriptionComputedFieldTests()
        {
            fixture = new Fixture();
            db = fixture.Freeze<Db>();

            computedField = new ResortDescriptionComputedField();
        }

        [Fact]
        public void IsValid_ShouldBeTrue_IfItemHasAccommodationTemplate()
        {
            // Arrange
            var item = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            item.TemplateID = Constants.TemplateIds.Accommodation;

            db.Add(item);

            // Act
            var actual = computedField.IsValid(db.GetItem(item.ID));

            // Assert
            actual.Should().BeTrue();
        }

        [Theory]
        [AutoData]
        public void ComputedField_ShouldReturnDescription_IfDescriptionExists(string description)
        {
            // Arrange
            var resortItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            resortItem.TemplateID = Constants.TemplateIds.Resort;
            db.Add(resortItem);

            var pageComponentsFolderItem = fixture.Build<DbItem>().With(x => x.ParentID, resortItem.ID).Create();
            pageComponentsFolderItem.TemplateID = Constants.TemplateIds.PageComponentsFolder;
            db.Add(pageComponentsFolderItem);

            var destinationsInfoBlocksFolderItem = fixture.Build<DbItem>().With(x => x.ParentID, pageComponentsFolderItem.ID).Create();
            destinationsInfoBlocksFolderItem.TemplateID = Constants.TemplateIds.DestinationInfoBlocksFolder;
            db.Add(destinationsInfoBlocksFolderItem);

            var destinationInfoBlockItem = fixture.Build<DbItem>().With(x => x.ParentID, destinationsInfoBlocksFolderItem.ID).Create();
            destinationInfoBlockItem.TemplateID = Constants.TemplateIds.DestinationInfoBlock;

            var textBlockDescriptionField = new DbField(Constants.Fields.DestinationInfoBlock.Description)
            {
                Value = description
            };

            destinationInfoBlockItem.Fields.Add(textBlockDescriptionField);
            db.Add(destinationInfoBlockItem);

            var hotelItem = fixture.Build<DbItem>().With(x => x.ParentID, resortItem.ID).Create();
            db.Add(hotelItem);

            var indexableItem = new SitecoreIndexableItem(db.GetItem(hotelItem.ID));

            // Act
            var fakeSiteContext = new Sitecore.FakeDb.Sites.FakeSiteContext(
                new Sitecore.Collections.StringDictionary
                {
                    { "name", "Holidays" },
                    { "database", "master" }
                });

            // Act
            using (new SettingsSwitcher("Destinations.SiteContextName", "Holidays"))
            using (new Sitecore.FakeDb.Sites.FakeSiteContextSwitcher(fakeSiteContext))
            {
                var actual = computedField.ComputeField(indexableItem);

                // Assert
                actual.Should().Be(description);
            }
        }

        [Fact]
        public void ComputedField_ShouldBeNull_IfResortItemIsNull()
        {
            // Arrange
            var hotelItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            db.Add(hotelItem);

            var indexableItem = new SitecoreIndexableItem(db.GetItem(hotelItem.ID));

            var fakeSiteContext = new Sitecore.FakeDb.Sites.FakeSiteContext(
                new Sitecore.Collections.StringDictionary
                {
                    { "name", "Holidays" },
                    { "database", "master" }
                });

            // Act
            using (new SettingsSwitcher("Destinations.SiteContextName", "Holidays"))
            using (new Sitecore.FakeDb.Sites.FakeSiteContextSwitcher(fakeSiteContext))
            {
                var actual = computedField.ComputeField(indexableItem);

                // Assert
                actual.Should().BeNull();
            }
        }

        [Fact]
        public void ComputedField_ShouldReturnNull_IfTextBlockNotExist()
        {
            // Arrange
            var resortItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            resortItem.TemplateID = Constants.TemplateIds.Resort;
            db.Add(resortItem);

            var hotelItem = fixture.Build<DbItem>().With(x => x.ParentID, resortItem.ID).Create();
            db.Add(hotelItem);

            var indexableItem = new SitecoreIndexableItem(db.GetItem(hotelItem.ID));

            var fakeSiteContext = new Sitecore.FakeDb.Sites.FakeSiteContext(
                new Sitecore.Collections.StringDictionary
                {
                    { "name", "Holidays" },
                    { "database", "master" }
                });

            // Act
            using (new SettingsSwitcher("Destinations.SiteContextName", "Holidays"))
            using (new Sitecore.FakeDb.Sites.FakeSiteContextSwitcher(fakeSiteContext))
            {
                var actual = computedField.ComputeField(indexableItem);

                // Assert
                actual.Should().BeNull();
            }
        }
    }
}
