using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Services;
using FluentAssertions;
using Sitecore.Data;
using Sitecore.FakeDb;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Services
{
    public class FacilityHeadersServiceTests
    {
        private readonly FacilityHeadersService service;

        public FacilityHeadersServiceTests()
        {
            service = new FacilityHeadersService();
        }

        [AutoData]
        [Theory]
        public void GetFacilityHeaders_ShouldReturnAllFacilityHeaders_IfFacilityHeadersExist(Db db, DatasourceObject facilityTypeGroup, DatasourceObject facilityType, FacilityHeader facilityHeader)
        {
            // Arrange
            var dataDbItem = new DbItem("Data", ID.NewID, Multisite.Templates.Data.Id);
            var facilityTypesFolderDbItem = new DbItem("Facility Types");
            var facilityTypeGroupDbItem = new DbItem(facilityTypeGroup.Name, ID.NewID, Constants.TemplateIds.FacilityTypesGroup);
            facilityTypeGroupDbItem.Fields.Add(Constants.Fields.DatasourceItem.Code, facilityTypeGroup.Code);
            facilityTypeGroupDbItem.Fields.Add(Constants.Fields.DatasourceItem.Name, facilityTypeGroup.Name);
            var facilityTypeDbItem = new DbItem(facilityType.Name, ID.NewID, Constants.TemplateIds.FacilityTypesGroup);
            facilityTypeDbItem.Fields.Add(Constants.Fields.DatasourceItem.Code, facilityType.Code);
            facilityTypeDbItem.Fields.Add(Constants.Fields.DatasourceItem.Name, facilityType.Name);
            facilityTypeGroupDbItem.Add(facilityTypeDbItem);
            facilityTypesFolderDbItem.Add(facilityTypeGroupDbItem);
            dataDbItem.Add(facilityTypeGroupDbItem);
            var facilityheadersFolderDbItem = new DbItem("Facility Headers", ID.NewID, Constants.TemplateIds.FacilityHeaderFolder);
            var facilityHeaderDbItem = new DbItem(facilityHeader.Name, ID.NewID, Constants.TemplateIds.FacilityHeader);
            facilityHeaderDbItem.Fields.Add(Constants.Fields.DatasourceItem.Name, facilityHeader.Name);
            facilityHeaderDbItem.Fields.Add(Constants.Fields.FacilityHeader.Facilities, facilityTypeDbItem.ID.ToString());
            facilityheadersFolderDbItem.Add(facilityHeaderDbItem);
            dataDbItem.Add(facilityheadersFolderDbItem);
            db.Add(dataDbItem);

            // Act
            var actual = service.GetFacilityHeaders(db.GetItem(dataDbItem.ID));

            // Assert
            actual.Should().NotBeNull();
            actual.Should().HaveCount(1);
            actual[0].Name.Should().Be(facilityHeader.Name);
            actual[0].FacilityFilteredTypes.Should().HaveCount(1);
        }
    }
}
