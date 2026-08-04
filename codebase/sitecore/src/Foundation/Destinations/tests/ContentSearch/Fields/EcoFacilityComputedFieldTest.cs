using easyJet.Foundation.Destinations.ContentSearch.Fields;
using easyjet.Foundation.Testing.Attributes;
using FluentAssertions;
using Sitecore.ContentSearch;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.ContentSearch.Fields
{
    public class EcoFacilityComputedFieldTest
    {
        private readonly EcoFacilityComputedField computedField;

        public EcoFacilityComputedFieldTest()
        {
            computedField = new EcoFacilityComputedField();
        }

        [Theory]
        [AutoDbData]
        public void IsValid_ShouldBeTrue_IfValidTemplate(Item item)
        {
            // Arrange
            using (new Sitecore.SecurityModel.SecurityDisabler())
            {
                using (new EditContext(item))
                {
                    item.TemplateID = Constants.TemplateIds.Accommodation;
                }
            }

            // Act
            var actual = computedField.IsValid(new SitecoreIndexableItem(item));

            // Assert
            actual.Should().BeTrue();
        }

        [Theory]
        [AutoDbData]
        public void IsValid_ShouldBeFalse_IfNoValidTemplate(Item item)
        {
            // Act
            var actual = computedField.IsValid(new SitecoreIndexableItem(item));

            // Assert
            actual.Should().BeFalse();
        }

        [Theory]
        [AutoDbData]
        public void ComputeField_ShouldNotBeNull_IfEcoFacilityExists(Db db)
        {
            // Arrange
            var accommodationDbItem = new DbItem("accommodation", ID.NewID, Constants.TemplateIds.Accommodation);
            var accommodationFacilitiesFolderDbItem = new DbItem("accommodationFacilitiesFolder", ID.NewID, Constants.TemplateIds.AccommodationFacilitiesFolder);
            var accommodationFacilityDbItem = new DbItem("accommodationFacility", ID.NewID, Constants.TemplateIds.AccommodationFacility);
            accommodationFacilityDbItem.Name = "24hour reception";
            var dbField = new DbField(Constants.Fields.BaseAppearance.ShowOnSite);
            dbField.Name = Constants.Fields.BaseAppearance.ShowOnSite;
            dbField.SetValue("en", Constants.Common.CheckboxTrueValue);

            var facilityFilterGroupDbItem = new DbItem("facilityFilterGroup", ID.NewID, new ID("{A5E834E6-986E-4668-8711-B83F507A7871}"));
            var facilityFilterGroupCodeDbField = new DbField("Code");
            facilityFilterGroupCodeDbField.SetValue("en", "70-ECO");
            facilityFilterGroupDbItem.Add(facilityFilterGroupCodeDbField);
            db.Add(facilityFilterGroupDbItem);

            var dbField2 = new DbField(Constants.Fields.BaseFacilityItem.FacilityType);
            dbField2.Name = Constants.Fields.BaseFacilityItem.FacilityType;
            dbField2.SetValue("en", facilityFilterGroupDbItem.ID.ToString());

            accommodationFacilityDbItem.Add(dbField);
            accommodationFacilityDbItem.Add(dbField2);

            accommodationFacilitiesFolderDbItem.Add(accommodationFacilityDbItem);
            accommodationDbItem.Add(accommodationFacilitiesFolderDbItem);

            db.Add(accommodationDbItem);
            var dbItem = db.GetItem(accommodationDbItem.ID);
            var indexAbleItem = new SitecoreIndexableItem(dbItem);

            // Act
            var actual = computedField.ComputeField(indexAbleItem);

            // Assert
            actual.Should().BeEquivalentTo("{\"SortOrder\":0,\"IsErrataInfo\":false,\"FacilityCode\":\"70-ECO\"}");
        }

        [Theory]
        [AutoDbData]
        public void ComputeField_ShouldBeNull_IfShowOnSiteIsNotSet(Db db)
        {
            // Arrange
            var accommodationDbItem = new DbItem("accommodation", ID.NewID, Constants.TemplateIds.Accommodation);
            var accommodationFacilitiesFolderDbItem = new DbItem("accommodationFacilitiesFolder", ID.NewID, Constants.TemplateIds.AccommodationFacilitiesFolder);
            var accommodationFacilityDbItem = new DbItem("accommodationFacility", ID.NewID, Constants.TemplateIds.AccommodationFacility);
            accommodationFacilityDbItem.Name = "24hour reception";
            var dbField = new DbField(Constants.Fields.BaseAppearance.ShowOnSite);
            dbField.Name = Constants.Fields.BaseAppearance.ShowOnSite;
            dbField.SetValue("en", Constants.Common.CheckboxFalseValue);

            var facilityFilterGroupDbItem = new DbItem("facilityFilterGroup", ID.NewID, new ID("{A5E834E6-986E-4668-8711-B83F507A7871}"));
            var facilityFilterGroupCodeDbField = new DbField("Code");
            facilityFilterGroupCodeDbField.SetValue("en", "70-ECO");
            facilityFilterGroupDbItem.Add(facilityFilterGroupCodeDbField);
            db.Add(facilityFilterGroupDbItem);

            var dbField2 = new DbField(Constants.Fields.BaseFacilityItem.FacilityType);
            dbField2.Name = Constants.Fields.BaseFacilityItem.FacilityType;
            dbField2.SetValue("en", facilityFilterGroupDbItem.ID.ToString());

            accommodationFacilityDbItem.Add(dbField);
            accommodationFacilityDbItem.Add(dbField2);

            accommodationFacilitiesFolderDbItem.Add(accommodationFacilityDbItem);
            accommodationDbItem.Add(accommodationFacilitiesFolderDbItem);

            db.Add(accommodationDbItem);
            var dbItem = db.GetItem(accommodationDbItem.ID);
            var indexAbleItem = new SitecoreIndexableItem(dbItem);

            // Act
            var actual = computedField.ComputeField(indexAbleItem);

            // Assert
            actual.Should().BeNull();
        }
    }
}