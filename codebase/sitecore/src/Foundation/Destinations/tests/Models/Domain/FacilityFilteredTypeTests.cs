using AutoFixture;
using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.Models.Domain;
using FluentAssertions;
using Sitecore.FakeDb;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Models.Domain
{
    public class FacilityFilteredTypeTests
    {
        private readonly Fixture fixture;
        private readonly Db db;

        public FacilityFilteredTypeTests()
        {
            fixture = new Fixture();
            db = fixture.Freeze<Db>();
        }

        [Theory]
        [AutoData]
        public void
            FacilityFilteredTypeFacilityGroup_ShouldBeFilledByRightData_IfFacilityTypeWithShowInFilterDatasourceSetted(
                string facilityName, string facilityCode, string facilityGroupName, string facilityGroupCode)
        {
            // Arrange
            var facilityTypeItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            facilityTypeItem.TemplateID = Constants.TemplateIds.FacilityType;

            var facilityTypeGroupParentItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            var facilityTypeGroupItem =
                fixture.Build<DbItem>().With(x => x.ParentID, facilityTypeGroupParentItem.ID).Create();
            facilityTypeGroupItem.TemplateID = Constants.TemplateIds.FacilityType;

            var facilityGroupField = new DbField(Constants.Fields.FacilityTypeItem.FacilityFilterGroup)
            {
                Type = "Lookup", Value = facilityTypeGroupItem.ID.ToString()
            };

            var nameField = CreateDbField(Constants.Fields.DatasourceItem.Name, facilityName);
            var codeField = CreateDbField(Constants.Fields.DatasourceItem.Code, facilityCode);

            var nameGroupField = CreateDbField(Constants.Fields.DatasourceItem.Name, facilityGroupName);
            var codeGroupField = CreateDbField(Constants.Fields.DatasourceItem.Code, facilityGroupCode);
            var showInFilterGroupField = CreateDbField(
                Constants.Fields.FacilityTypeItem.ShowInFilter,
                Constants.Common.CheckboxTrueValue);

            var nameGroupParentField = CreateDbField(Constants.Fields.DatasourceItem.Name, facilityName);

            var codeGroupParentField = CreateDbField(Constants.Fields.DatasourceItem.Code, facilityCode);

            facilityTypeItem.Fields.Add(nameField);
            facilityTypeItem.Fields.Add(codeField);
            facilityTypeItem.Fields.Add(facilityGroupField);
            facilityTypeItem.Fields.Add(showInFilterGroupField);

            facilityTypeGroupParentItem.Fields.Add(nameGroupParentField);
            facilityTypeGroupParentItem.Fields.Add(codeGroupParentField);

            facilityTypeGroupItem.Fields.Add(nameGroupField);
            facilityTypeGroupItem.Fields.Add(codeGroupField);
            facilityTypeGroupItem.Fields.Add(showInFilterGroupField);

            db.Add(facilityTypeItem);
            db.Add(facilityTypeGroupParentItem);
            db.Add(facilityTypeGroupItem);

            // Act
            var actual = new FacilityFilteredType(db.GetItem(facilityTypeItem.ID)).FacilityFilterGroup;

            // Assert
            actual.Name.Should().Be(facilityGroupName);
            actual.Code.Should().Be($"{facilityCode}-{facilityGroupCode}");
            actual.ParentName.Should().Be(facilityName);
            actual.ParentCode.Should().Be(facilityCode);
        }

        [Theory]
        [AutoData]
        public void
            FacilityFilteredTypeFacilityGroup_ShouldBeFilledWithNull_IfFacilityTypeNoShowInFilterDatasourceSetted(
                string facilityName, string facilityCode, string facilityGroupName, string facilityGroupCode)
        {
            // Arrange
            var facilityTypeItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            facilityTypeItem.TemplateID = Constants.TemplateIds.FacilityType;

            var facilityTypeGroupParentItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            var facilityTypeGroupItem =
                fixture.Build<DbItem>().With(x => x.ParentID, facilityTypeGroupParentItem.ID).Create();
            facilityTypeGroupItem.TemplateID = Constants.TemplateIds.FacilityType;

            var facilityGroupField = new DbField(Constants.Fields.FacilityTypeItem.FacilityFilterGroup)
            {
                Type = "Lookup", Value = facilityTypeGroupItem.ID.ToString()
            };

            var nameField = CreateDbField(Constants.Fields.DatasourceItem.Name, facilityName);
            var codeField = CreateDbField(Constants.Fields.DatasourceItem.Code, facilityCode);

            var nameGroupField = CreateDbField(Constants.Fields.DatasourceItem.Name, facilityGroupName);
            var codeGroupField = CreateDbField(Constants.Fields.DatasourceItem.Code, facilityGroupCode);
            var showInFilterGroupField = CreateDbField(
                Constants.Fields.FacilityTypeItem.ShowInFilter,
                Constants.Common.CheckboxFalseValue);

            var nameGroupParentField = CreateDbField(Constants.Fields.DatasourceItem.Name, facilityName);

            var codeGroupParentField = CreateDbField(Constants.Fields.DatasourceItem.Code, facilityCode);

            facilityTypeItem.Fields.Add(nameField);
            facilityTypeItem.Fields.Add(codeField);
            facilityTypeItem.Fields.Add(facilityGroupField);
            facilityTypeItem.Fields.Add(showInFilterGroupField);

            facilityTypeGroupParentItem.Fields.Add(nameGroupParentField);
            facilityTypeGroupParentItem.Fields.Add(codeGroupParentField);

            facilityTypeGroupItem.Fields.Add(nameGroupField);
            facilityTypeGroupItem.Fields.Add(codeGroupField);
            facilityTypeGroupItem.Fields.Add(showInFilterGroupField);

            db.Add(facilityTypeItem);
            db.Add(facilityTypeGroupParentItem);
            db.Add(facilityTypeGroupItem);

            // Act
            var actual = new FacilityFilteredType(db.GetItem(facilityTypeItem.ID)).FacilityFilterGroup;

            // Assert
            actual.Name.Should().BeNull();
            actual.Code.Should().BeNull();
            actual.ParentName.Should().BeNull();
            actual.ParentCode.Should().BeNull();
        }

        [Fact]
        public void FacilityFilteredTypeFacilityGroup_ShouldBeNull_IfPassedNotFacilityType()
        {
            // Arrange
            var facilityTypeItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            db.Add(facilityTypeItem);

            // Act
            var actual = new FacilityFilteredType(db.GetItem(facilityTypeItem.ID)).FacilityFilterGroup;

            // Assert
            actual.Should().BeNull();
        }

        [Fact]
        public void FacilityFilteredTypeFacilityGroup_ShouldBeNull_IfFacilityTypeNotHaveFacilityGroupDatasource()
        {
            // Arrange
            var facilityTypeItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            facilityTypeItem.TemplateID = Constants.TemplateIds.FacilityType;

            db.Add(facilityTypeItem);

            // Act
            var actual = new FacilityFilteredType(db.GetItem(facilityTypeItem.ID)).FacilityFilterGroup;

            // Assert
            actual.Should().BeNull();
        }

        [Fact]
        public void FacilityFilteredTypeFacilityGroup_ShouldHasNullData_IfDatasourceHasWrongTemplate()
        {
            // Arrange
            var facilityTypeItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            facilityTypeItem.TemplateID = Constants.TemplateIds.FacilityType;

            var facilityTypeGroupParentItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            var facilityTypeGroupItem = fixture.Build<DbItem>().With(x => x.ParentID, facilityTypeGroupParentItem.ID).Create();

            var facilityGroupField = new DbField(Constants.Fields.FacilityTypeItem.FacilityFilterGroup)
            {
                Type = "Lookup",
                Value = facilityTypeGroupItem.ID.ToString()
            };

            var nameField = CreateDbField(Constants.Fields.DatasourceItem.Name, string.Empty);
            var codeField = CreateDbField(Constants.Fields.DatasourceItem.Code, string.Empty);

            facilityTypeItem.Fields.Add(nameField);
            facilityTypeItem.Fields.Add(codeField);
            facilityTypeItem.Fields.Add(facilityGroupField);

            db.Add(facilityTypeItem);
            db.Add(facilityTypeGroupParentItem);
            db.Add(facilityTypeGroupItem);

            // Act
            var actual = new FacilityFilteredType(db.GetItem(facilityTypeItem.ID)).FacilityFilterGroup;

            // Assert
            actual.Name.Should().BeNull();
            actual.Code.Should().BeNull();
            actual.ParentName.Should().BeNull();
            actual.ParentCode.Should().BeNull();
        }

        private DbField CreateDbField(string fieldName, string fieldValue)
        {
            return new DbField(fieldName)
            {
                Value = fieldValue
            };
        }
    }
}
