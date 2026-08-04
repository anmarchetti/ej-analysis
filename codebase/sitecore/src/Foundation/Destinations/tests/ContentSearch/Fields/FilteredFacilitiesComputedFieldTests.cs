using System.Collections.Generic;
using System.Linq;
using AutoFixture;
using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.ContentSearch.Fields;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Services;
using FluentAssertions;
using Newtonsoft.Json;
using NSubstitute;
using Sitecore.ContentSearch;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.ContentSearch.Fields
{
    public class FilteredFacilitiesComputedFieldTests
    {
        private readonly FilteredFacilitiesComputedField filteredFacilitiesComputedField;
        private readonly IFacilityHeadersService facilityHeadersService;
        private readonly Fixture fixture;
        private readonly Db db;

        public FilteredFacilitiesComputedFieldTests()
        {
            // Arrange
            facilityHeadersService = Substitute.For<IFacilityHeadersService>();
            filteredFacilitiesComputedField = new FilteredFacilitiesComputedField(facilityHeadersService);
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

            facilityHeadersService.GetFacilityHeaders(Arg.Any<Item>()).Returns(new List<FacilityHeader>());
            facilityHeadersService.MapFacilityHeaders(Arg.Any<IEnumerable<FacilityHeader>>(), Arg.Any<IEnumerable<FacilityFilteredType>>()).Returns(new List<FacilityHeader>());

            // Act
            var actual = filteredFacilitiesComputedField.ComputeField(indexableItem) as List<string>;

            // Assert
            actual.Should().BeNull();
        }

        [Fact]
        public void ComputeReference_ShouldBeEmpty_IfReferenceTypeIsNotValid()
        {
            // Arrange
            var folder = GetDbItem(ID.NewID);
            var facilities = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            facilities.TemplateID = Constants.TemplateIds.AccommodationFacilitiesFolder;
            var child = GetDbItem(Constants.TemplateIds.AccommodationFacility);
            child.Fields.Add(Constants.Fields.BaseFacilityItem.FacilityType, string.Empty);

            facilities.Children.Add(child);
            folder.Children.Add(facilities);
            db.Add(folder);

            var indexableItem = new SitecoreIndexableItem(db.GetItem(folder.ID));

            var headers = new List<FacilityHeader>()
            {
                new FacilityHeader()
                {
                    Name = string.Empty,
                    FacilityFilteredTypes = new List<FacilityFilteredType>()
                    {
                        new FacilityFilteredType(db.GetItem(child.ID), 0)
                    }
                }
            };
            facilityHeadersService.GetFacilityHeaders(Arg.Any<Item>()).Returns(headers);
            facilityHeadersService.MapFacilityHeaders(Arg.Any<IEnumerable<FacilityHeader>>(), Arg.Any<IEnumerable<FacilityFilteredType>>()).Returns(new List<FacilityHeader>());

            // Act
            var actual = filteredFacilitiesComputedField.ComputeField(indexableItem) as List<string>;

            // Assert
            actual.Should().BeNull();
        }

        [Fact]
        public void ComputeReference_ShouldBeEmpty_IfShowOnSiteFieldIsUnchecked()
        {
            // Arrange
            var folder = GetDbItem(ID.NewID);
            var facilities = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            facilities.TemplateID = Constants.TemplateIds.AccommodationFacilitiesFolder;
            var child = GetDbItem(Constants.TemplateIds.AccommodationFacility);
            child.Fields.Add(GetLookupField(Constants.Fields.BaseFacilityItem.FacilityType));
            child.Fields.Add(Constants.Fields.BaseAppearance.ShowOnSite, "0");

            facilities.Children.Add(child);
            folder.Children.Add(facilities);
            db.Add(folder);

            var indexableItem = new SitecoreIndexableItem(db.GetItem(folder.ID));

            var headers = new List<FacilityHeader>()
            {
                new FacilityHeader()
                {
                    Name = string.Empty,
                    FacilityFilteredTypes = new List<FacilityFilteredType>()
                    {
                        new FacilityFilteredType(db.GetItem(child.ID), 0)
                    }
                }
            };
            facilityHeadersService.GetFacilityHeaders(Arg.Any<Item>()).Returns(headers);
            facilityHeadersService.MapFacilityHeaders(Arg.Any<IEnumerable<FacilityHeader>>(), Arg.Any<IEnumerable<FacilityFilteredType>>()).Returns(new List<FacilityHeader>());

            // Act
            var actual = filteredFacilitiesComputedField.ComputeField(indexableItem) as List<string>;

            // Assert
            actual.Should().BeNull();
        }

        [Fact]
        public void ComputeReference_ShouldBeEmpty_IfShowOnFilterFieldIsUnchecked()
        {
            // Arrange
            var folder = GetDbItem(ID.NewID);
            var accomadation = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            accomadation.TemplateID = Constants.TemplateIds.AccommodationFacilitiesFolder;
            var facilityAccommadation = GetDbItem(Constants.TemplateIds.AccommodationFacility);

            var facilityType = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            facilityType.Fields.Add(Constants.Fields.FacilityTypeItem.ShowInFilter, "0");

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
            var headers = new List<FacilityHeader>()
            {
                new FacilityHeader()
                {
                    Name = string.Empty,
                    FacilityFilteredTypes = new List<FacilityFilteredType>()
                    {
                        new FacilityFilteredType(db.GetItem(facilityType.ID), 0)
                    }
                }
            };
            facilityHeadersService.GetFacilityHeaders(Arg.Any<Item>()).Returns(headers);
            facilityHeadersService.MapFacilityHeaders(Arg.Any<IEnumerable<FacilityHeader>>(), Arg.Any<IEnumerable<FacilityFilteredType>>()).Returns(new List<FacilityHeader>());

            // Act
            var actual = filteredFacilitiesComputedField.ComputeField(indexableItem) as List<string>;

            // Assert
            actual.Should().BeNull();
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
            facilityType.Fields.Add(Constants.Fields.FacilityTypeItem.ShowInFilter, Constants.Common.CheckboxTrueValue);
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

            var headers = new List<FacilityHeader>()
            {
                new FacilityHeader()
                {
                    Name = string.Empty,
                    FacilityFilteredTypes = new List<FacilityFilteredType>()
                    {
                        new FacilityFilteredType(db.GetItem(facilityType.ID), 0)
                    }
                }
            };
            facilityHeadersService.GetFacilityHeaders(Arg.Any<Item>()).Returns(headers);
            facilityHeadersService.MapFacilityHeaders(Arg.Any<IEnumerable<FacilityHeader>>(), Arg.Any<IEnumerable<FacilityFilteredType>>()).Returns(headers);

            // Act
            var actual = filteredFacilitiesComputedField.ComputeField(indexableItem) as List<string>;

            // Assert
            actual.Should().NotBeEmpty();
        }

        [AutoData]
        [Theory]
        public void ComputeField_SerializedJson_IncludesTrackingId_OnHeaderAndFilteredTypes(string facilityTypeCode)
        {
            // Arrange — same accommodation setup as successful index path
            var accomadation = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            var facilityAccommadationFolder = GetDbItem(Constants.TemplateIds.AccommodationFacilitiesFolder);
            var facilityAccommadation = GetDbItem(Constants.TemplateIds.AccommodationFacility);
            facilityAccommadationFolder.Add(facilityAccommadation);

            var facilityType = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            facilityType.Fields.Add(Constants.Fields.FacilityTypeItem.ShowInFilter, Constants.Common.CheckboxTrueValue);
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

            var headers = new List<FacilityHeader>
            {
                new FacilityHeader
                {
                    Name = "Pool",
                    TrackingId = "pool-header-tracking",
                    FacilityFilteredTypes = new List<FacilityFilteredType>
                    {
                        new FacilityFilteredType
                        {
                            Code = facilityTypeCode,
                            TrackingId = "facility-type-tracking",
                            Order = 0,
                            FacilityFilterGroup = new FacilityFilterGroup { TrackingId = "filter-group-tracking" },
                        },
                    },
                },
            };
            facilityHeadersService.GetFacilityHeaders(Arg.Any<Item>()).Returns(headers);
            facilityHeadersService.MapFacilityHeaders(Arg.Any<IEnumerable<FacilityHeader>>(), Arg.Any<IEnumerable<FacilityFilteredType>>()).Returns(headers);

            // Act
            var actual = filteredFacilitiesComputedField.ComputeField(indexableItem) as List<string>;

            // Assert — proves TrackingId is stored inside filtered_facility JSON blobs
            actual.Should().NotBeEmpty();
            var deserialized = JsonConvert.DeserializeObject<FacilityHeader>(actual[0]);
            deserialized.TrackingId.Should().Be("pool-header-tracking");
            deserialized.FacilityFilteredTypes.First().TrackingId.Should().Be("facility-type-tracking");
            deserialized.FacilityFilteredTypes.First().FacilityFilterGroup.TrackingId.Should().Be("filter-group-tracking");
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
