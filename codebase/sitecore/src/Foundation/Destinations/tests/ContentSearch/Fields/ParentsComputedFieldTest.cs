using System.Collections.Generic;
using AutoFixture;
using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.ContentSearch.Fields;
using FluentAssertions;
using Sitecore.ContentSearch;
using Sitecore.Data;
using Sitecore.FakeDb;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.ContentSearch.Fields
{
    public class ParentsComputedFieldTest
    {
        private readonly ParentsComputedField parentsComputedField;
        private readonly Fixture fixture;
        private readonly Db db;

        public ParentsComputedFieldTest()
        {
            // Arrange
            parentsComputedField = new ParentsComputedField();
            fixture = new Fixture();
            db = fixture.Freeze<Db>();
        }

        [Theory]
        [MemberData(nameof(ValidTemplates))]
        public void IsValid_SholdBeTrue_IfValidTemplate(ID templateId)
        {
            // Arrange
            var item = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            item.TemplateID = templateId;
            db.Add(item);

            // Act
            var actual = parentsComputedField.IsValid(new SitecoreIndexableItem(db.GetItem(item.ID)));

            // Assert
            actual.Should().BeTrue();
        }

        [Fact]
        public void IsValid_SholdBeFalse_IfNoValidTemplate()
        {
            // Arrange
            var item = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            item.TemplateID = ID.NewID;
            db.Add(item);

            // Act
            var actual = parentsComputedField.IsValid(new SitecoreIndexableItem(db.GetItem(item.ID)));

            // Assert
            actual.Should().BeFalse();
        }

        [Theory]
        [AutoData]
        public void ComputeField_SholdNotBeNotNull_IfParentHasValidTemplate(string code)
        {
            // Arrange
            var countryDbItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            var parentDbItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            parentDbItem.TemplateID = Constants.TemplateIds.BaseCode;
            parentDbItem.Fields.Add(Constants.Fields.DatasourceItem.Code, code);

            countryDbItem.ParentID = parentDbItem.ID;
            countryDbItem.TemplateID = Constants.TemplateIds.Country;

            db.Add(parentDbItem);
            db.Add(countryDbItem);

            var countryIndexableItem = new SitecoreIndexableItem(db.GetItem(countryDbItem.ID));

            // Act
            var actual = parentsComputedField.ComputeField(countryIndexableItem);

            // Assert
            actual.Should().NotBeNull();
        }

        [Fact]
        public void ComputeField_ShouldReturnNotEmptyResult_IfItemHasParents()
        {
            // Arrange
            var countryItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            countryItem.TemplateID = Constants.TemplateIds.Country;
            db.Add(countryItem);

            var regionItem = fixture.Build<DbItem>().With(x => x.ParentID, countryItem.ID).Create();
            regionItem.TemplateID = Constants.TemplateIds.Location;
            db.Add(regionItem);

            var resortItem = fixture.Build<DbItem>().With(x => x.ParentID, regionItem.ID).Create();
            resortItem.TemplateID = Constants.TemplateIds.Resort;
            db.Add(resortItem);

            var hotelItem = fixture.Build<DbItem>().With(x => x.ParentID, resortItem.ID).Create();
            hotelItem.TemplateID = Constants.TemplateIds.Accommodation;
            db.Add(hotelItem);

            var indexableItem = new SitecoreIndexableItem(db.GetItem(hotelItem.ID));

            // Act
            var actual = parentsComputedField.ComputeField(db.GetItem(hotelItem.ID));

            // Assert
            actual.Should().NotBeNull();
        }

        [Theory]
        [AutoData]
        public void ComputeField_ShouldReturnVirtualCountryParent_IfVirtualCountryHasRelatedRegions(string code)
        {
            // Arrange
            var countryItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            countryItem.Fields.Add(Constants.Fields.DatasourceItem.Code, code);
            countryItem.TemplateID = Constants.TemplateIds.Country;
            db.Add(countryItem);

            var virtualCountryDbItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            var regionDbIttem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            regionDbIttem.ParentID = countryItem.ID;
            db.Add(regionDbIttem);

            virtualCountryDbItem.Fields.Add(Constants.Fields.VirtualDestination.Regions, regionDbIttem.ID.ToString());
            virtualCountryDbItem.TemplateID = Constants.TemplateIds.VirtualCountry;

            db.Add(virtualCountryDbItem);

            var countryIndexableItem = new SitecoreIndexableItem(db.GetItem(virtualCountryDbItem.ID));

            // Act
            var actual = parentsComputedField.ComputeField(countryIndexableItem);

            // Assert
            actual.Should().NotBeNull();
        }

        public static IEnumerable<object[]> ValidTemplates => new[]
            {
                new object[] { Constants.TemplateIds.Country },
                new object[] { Constants.TemplateIds.Location },
                new object[] { Constants.TemplateIds.LocationCity },
                new object[] { Constants.TemplateIds.Resort },
                new object[] { Constants.TemplateIds.Accommodation },
                new object[] { Constants.TemplateIds.VirtualCountry },
                new object[] { Constants.TemplateIds.VirtualRegion },
                new object[] { Constants.TemplateIds.VirtualResort },
            };
    }
}
