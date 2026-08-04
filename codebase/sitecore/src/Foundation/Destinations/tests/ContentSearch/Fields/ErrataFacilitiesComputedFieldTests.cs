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
    public class ErrataFacilitiesComputedFieldTests
    {
        private readonly ErrataFacilitiesComputedField errataFacilitiesComputedField;
        private readonly Fixture fixture;
        private readonly Db db;

        public ErrataFacilitiesComputedFieldTests()
        {
            // Arrange
            errataFacilitiesComputedField = new ErrataFacilitiesComputedField();
            fixture = new Fixture();
            db = fixture.Freeze<Db>();
        }

        [Fact]
        public void ComputeReference_ShouldBeEmpty_IfNotValidTemplate()
        {
            // Arrange
            var facilities = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            var child = GetDbItem(ID.NewID);

            facilities.Children.Add(child);
            db.Add(facilities);

            var indexableItem = new SitecoreIndexableItem(db.GetItem(facilities.ID));

            // Act
            var actual = errataFacilitiesComputedField.ComputeField(indexableItem) as List<string>;

            // Assert
            actual.Should().BeNull();
        }

        [Fact]
        public void ComputeReference_ShouldBeEmpty_IfReferenceTypeIsNotValid()
        {
            // Arrange
            var folder = new DbItem("folder", ID.NewID);
            var parent = new DbItem("parent", ID.NewID, Constants.AccommodationReferences.Facilities.Key);
            var child = new DbItem("child", ID.NewID, Constants.AccommodationReferences.Facilities.Value);
            child.Fields.Add(Constants.Fields.BaseFacilityItem.FacilityType, string.Empty);
            parent.Children.Add(child);
            folder.Children.Add(parent);
            db.Add(folder);

            var indexableItem = new SitecoreIndexableItem(db.GetItem(folder.ID));

            // Act
            var actual = errataFacilitiesComputedField.ComputeField(indexableItem) as List<string>;

            // Assert
            actual.Should().BeEmpty();
        }

        [Fact]
        public void ComputeReference_ShouldBeEmpty_IfShowOnSiteFieldIsUnchecked()
        {
            // Arrange
            var folder = new DbItem("folder", ID.NewID);
            var parent = new DbItem("parent", ID.NewID, Constants.AccommodationReferences.Facilities.Key);
            var child = new DbItem("child", ID.NewID, Constants.AccommodationReferences.Facilities.Value);
            child.Fields.Add(GetLookupField(Constants.Fields.BaseFacilityItem.FacilityType));
            child.Fields.Add(Constants.Fields.BaseAppearance.ShowOnSite, "0");
            parent.Children.Add(child);
            folder.Children.Add(parent);
            db.Add(folder);
            var indexableItem = new SitecoreIndexableItem(db.GetItem(folder.ID));

            // Act
            var actual = errataFacilitiesComputedField.ComputeField(indexableItem) as List<string>;

            // Assert
            actual.Should().BeEmpty();
        }

        [Fact]
        public void ComputeReference_ShouldBeEmpty_IfShowOnFilterFieldIsUnchecked()
        {
            // Arrange
            var folder = new DbItem("folder", ID.NewID);
            var accomadation = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            accomadation.TemplateID = Constants.TemplateIds.AccommodationFacilitiesFolder;
            var facilityAccommadation = GetDbItem(Constants.TemplateIds.AccommodationFacility);

            var facilityType = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            facilityType.Fields.Add(Constants.Fields.FacilityTypeItem.SetAsFacilityErrata, "0");

            var facilityTypeField = new DbField(Constants.Fields.BaseFacilityItem.FacilityType)
            {
                Type = "Lookup",
                Value = facilityType.ID.ToString()
            };

            db.Add(facilityType);

            facilityAccommadation.Fields.Add(facilityTypeField);
            facilityAccommadation.Fields.Add(Constants.Fields.BaseAppearance.ShowOnSite, Constants.Common.CheckboxTrueValue);

            accomadation.Children.Add(facilityAccommadation);
            folder.Children.Add(accomadation);
            db.Add(folder);

            var indexableItem = new SitecoreIndexableItem(db.GetItem(folder.ID));

            // Act
            var actual = errataFacilitiesComputedField.ComputeField(indexableItem) as List<string>;

            // Assert
            actual.Should().BeEmpty();
        }

        [AutoData]
        [Theory]
        public void ComputeReference_ShouldBeNotEmpty_IfShowOnFilterIsChecked_And_ShowOnSiteIsChecked(string facilityTypeCode)
        {
            // Arrange
            var accomadation = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            var facilityAccommadationFolder = GetDbItem(Constants.TemplateIds.AccommodationFacilitiesFolder);
            var facilityAccommadation = GetDbItem(Constants.TemplateIds.AccommodationFacility);
            facilityAccommadationFolder.Add(facilityAccommadation);

            var facilityType = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            facilityType.Fields.Add(Constants.Fields.BaseAppearance.ShowOnSite, Constants.Common.CheckboxTrueValue);
            facilityType.Fields.Add(Constants.Fields.FacilityTypeItem.SetAsFacilityErrata, Constants.Common.CheckboxTrueValue);
            facilityType.Fields.Add(Constants.Fields.DatasourceItem.Code, facilityTypeCode);

            var facilityTypeField = new DbField(Constants.Fields.BaseFacilityItem.FacilityType)
            {
                Type = "Lookup",
                Value = facilityType.ID.ToString()
            };

            db.Add(facilityType);

            facilityAccommadation.Fields.Add(facilityTypeField);
            facilityAccommadation.Fields.Add(Constants.Fields.BaseAppearance.ShowOnSite, Constants.Common.CheckboxTrueValue);

            accomadation.Children.Add(facilityAccommadationFolder);
            db.Add(accomadation);

            var indexableItem = new SitecoreIndexableItem(db.GetItem(accomadation.ID));

            // Act
            var actual = errataFacilitiesComputedField.ComputeField(indexableItem) as IEnumerable<string>;

            // Assert
            actual.Should().NotBeEmpty();
        }

        private DbItem GetDbItem(ID templateId)
        {
            var itemDb = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            itemDb.TemplateID = templateId;
            return itemDb;
        }

        private DbField GetLookupField(string lookupFieldname)
        {
            var referenceDbItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            var referenceDbField = new DbField(lookupFieldname)
            {
                Type = "Lookup",
                Value = referenceDbItem.ID.ToString()
            };

            db.Add(referenceDbItem);
            return referenceDbField;
        }
    }
}
