using AutoFixture;
using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.Models.Domain;
using FluentAssertions;
using Sitecore.FakeDb;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Models.Domain
{
    public class FacilityFilterGroupTests
    {
        private readonly Fixture fixture;
        private readonly Db db;

        public FacilityFilterGroupTests()
        {
            fixture = new Fixture();
            db = fixture.Freeze<Db>();
        }

        [Fact]
        public void FacilityFilterGroupConstructor_ShouldNotSetValues_IfItemNull()
        {
            // Act
            var actual = new FacilityFilterGroup(null);

            // Assert
            actual.Name.Should().BeNull();
            actual.Code.Should().BeNull();
            actual.ParentName.Should().BeNull();
            actual.ParentCode.Should().BeNull();
        }

        [Fact]
        public void FacilityFilterGroupConstructor_ShouldNotSetValues_IfItemNotFacilityType()
        {
            // Arrange
            var item = fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            // Act
            var actual = new FacilityFilterGroup(null);

            // Assert
            actual.Name.Should().BeNull();
            actual.Code.Should().BeNull();
            actual.ParentName.Should().BeNull();
            actual.ParentCode.Should().BeNull();
        }

        [Fact]
        public void FacilityFilterGroupConstructor_ShouldNotSetValues_IfItemFieldsNotExistAndItemParentNotExist()
        {
            // Arrange
            var item = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            item.TemplateID = Constants.TemplateIds.FacilityType;

            db.Add(item);

            // Act
            var actual = new FacilityFilterGroup(db.GetItem(item.ID));

            // Assert
            actual.Name.Should().BeNull();
            actual.Code.Should().BeNull();
            actual.ParentName.Should().BeNull();
            actual.ParentCode.Should().BeNull();
        }

        [Fact]
        public void FacilityFilterGroupConstructor_ShouldNotSetValues_IfParentItemFieldsNotExist()
        {
            // Arrange
            var parentItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            var item = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            item.TemplateID = Constants.TemplateIds.FacilityType;

            parentItem.Children.Add(item);

            db.Add(parentItem);

            // Act
            var actual = new FacilityFilterGroup(db.GetItem(item.ID));

            // Assert
            actual.ParentName.Should().BeNull();
            actual.ParentCode.Should().BeNull();
        }

        [Theory]
        [AutoData]
        public void FacilityFilterGroupConstructor_ShouldSetValues_IfFacilityTypeWithShowInFilterAndParentFieldsExist(
            string parentName, string parentCode)
        {
            // Arrange
            var parentItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            parentItem.Fields.Add(Constants.Fields.DatasourceItem.Name, parentName);
            parentItem.Fields.Add(Constants.Fields.DatasourceItem.Code, parentCode);

            var item = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            item.TemplateID = Constants.TemplateIds.FacilityType;

            var showInFilter = CreateDbField(
                Constants.Fields.FacilityTypeItem.ShowInFilter,
                Constants.Common.CheckboxTrueValue);
            item.Fields.Add(showInFilter);

            parentItem.Children.Add(item);

            db.Add(parentItem);

            // Act
            var actual = new FacilityFilterGroup(db.GetItem(item.ID));

            // Assert
            actual.ParentName.Should().BeEquivalentTo(parentName);
            actual.ParentCode.Should().BeEquivalentTo(parentCode);
        }

        [Theory]
        [AutoData]
        public void
            FacilityFilterGroupConstructor_ShouldNotSetValues_IfFacilityTypeWithoutShowInFilterAndParentFieldsExist(
                string parentName, string parentCode)
        {
            // Arrange
            var parentItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            parentItem.Fields.Add(Constants.Fields.DatasourceItem.Name, parentName);
            parentItem.Fields.Add(Constants.Fields.DatasourceItem.Code, parentCode);

            var item = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            item.TemplateID = Constants.TemplateIds.FacilityType;

            var showInFilter = CreateDbField(
                Constants.Fields.FacilityTypeItem.ShowInFilter,
                Constants.Common.CheckboxFalseValue);
            item.Fields.Add(showInFilter);

            parentItem.Children.Add(item);

            db.Add(parentItem);

            // Act
            var actual = new FacilityFilterGroup(db.GetItem(item.ID));

            // Assert
            actual.ParentName.Should().BeNull();
            actual.ParentCode.Should().BeNull();
        }

        private DbField CreateDbField(string fieldName, string fieldValue)
        {
            return new DbField(fieldName) { Value = fieldValue };
        }
    }
}
