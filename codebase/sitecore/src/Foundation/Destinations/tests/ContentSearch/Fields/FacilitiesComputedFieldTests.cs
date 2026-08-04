using System.Collections.Generic;
using AutoFixture;
using easyJet.Foundation.Destinations.ContentSearch.Fields;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.ContentSearch;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.ContentSearch.Fields
{
    public class FacilitiesComputedFieldTests
    {
        private readonly FacilitiesComputedField facilitiesComputedField;
        private readonly Fixture fixture;
        private readonly Db db;
        private SitecoreIndexableItem indexableItem;
        private IVirtualFacilityGroupingService service;

        public FacilitiesComputedFieldTests()
        {
            // Arrange
            service = Substitute.For<IVirtualFacilityGroupingService>();
            facilitiesComputedField = new FacilitiesComputedField(service);
            fixture = new Fixture();
            db = fixture.Freeze<Db>();
        }

        [Fact]
        public void ComputeField_ShouldBeNull_IfHasNoItemsToMap()
        {
            // Assert
            var accomadation = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            var facility = GetFacilityDbItem();
            facility.Fields.Add(GetLookupFacilityField("0"));

            accomadation.Children.Add(facility);
            db.Add(accomadation);

            indexableItem = new SitecoreIndexableItem(db.GetItem(accomadation.ID));

            service.GetAllVirtualFacilities(indexableItem, false).Returns(new List<VirtualFacilityGroup>());
            // Act
            var actual = facilitiesComputedField.ComputeField(indexableItem);

            // Assert
            actual.Should().BeNull();
        }

        [Fact]
        public void ComputeField_ShouldNotBeNull_IfHasItemsToMap()
        {
            // Assert
            var accomadation = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            var facility = GetFacilityDbItem();
            facility.Fields.Add(GetLookupFacilityField(Constants.Common.CheckboxTrueValue));
            facility.Fields.Add(Constants.Fields.BaseAppearance.ShowOnSite, Constants.Common.CheckboxTrueValue);

            accomadation.Children.Add(facility);
            db.Add(accomadation);

            indexableItem = new SitecoreIndexableItem(db.GetItem(accomadation.ID));

            service.GetAllVirtualFacilities(indexableItem, false)
                .Returns(new List<VirtualFacilityGroup>() { new VirtualFacilityGroup() });
            service.MapFacilities(Arg.Any<IEnumerable<VirtualFacilityGroup>>(), Arg.Any<IEnumerable<HotelFacility>>(), Arg.Any<Item>())
                .Returns(new List<AccommodationFacilityVirtualGroup>());
            // Act
            var actual = facilitiesComputedField.ComputeField(indexableItem);

            // Assert
            actual.Should().NotBeNull();
        }

        private DbItem GetFacilityDbItem()
        {
            var itemDb = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            itemDb.TemplateID = Constants.TemplateIds.AccommodationFacility;
            return itemDb;
        }

        private DbField GetLookupFacilityField(string showOnSiteValue)
        {
            var referenceDbItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            referenceDbItem.Fields.Add(Constants.Fields.BaseAppearance.ShowOnSite, showOnSiteValue);

            var referenceDbField = new DbField(Constants.Fields.BaseFacilityItem.FacilityType)
            {
                Type = "Lookup",
                Value = referenceDbItem.ID.ToString()
            };

            db.Add(referenceDbItem);
            return referenceDbField;
        }
    }
}
