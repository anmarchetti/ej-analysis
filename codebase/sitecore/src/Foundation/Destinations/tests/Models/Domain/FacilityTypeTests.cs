using AutoFixture;
using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.Models.Domain;
using FluentAssertions;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Models.Domain
{
    public class FacilityTypeTests
    {
        private readonly Fixture fixture;
        private readonly Db db;

        public FacilityTypeTests()
        {
            // Arrange
            fixture = new Fixture();
            db = fixture.Freeze<Db>();
        }

        [Theory]
        [AutoData]
        public void Code_ShouldBeEmpty_IfHasNoFacilityCode(string parentCode)
        {
            // Arrange
            var parent = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            var child = fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            parent.Fields.Add(Constants.Fields.DatasourceItem.Code, parentCode);
            parent.Children.Add(child);

            db.Add(parent);

            // Act
            var actual = new FacilityType(db.GetItem(child.ID));

            // Assert
            actual.Code.Should().BeEmpty();
        }

        [Fact]
        public void CodeField_ShouldBeEmpty_IfItemIsNull()
        {
            // Arrange
            Item item = null;

            // Act
            var actual = new FacilityType(item);

            // Assert
            actual.Code.Should().BeEmpty();
        }

        [Theory]
        [AutoData]
        public void Code_ShouldBeNotEmpty_IfHasFacilityCode(string facilityCode)
        {
            // Arrange
            var parent = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            var child = fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            child.Fields.Add(Constants.Fields.DatasourceItem.Code, facilityCode);
            parent.Children.Add(child);

            db.Add(parent);

            // Act
            var actual = new FacilityType(db.GetItem(child.ID));

            // Assert
            actual.Code.Should().NotBeNullOrEmpty();
        }

        [Theory]
        [AutoData]
        public void Code_ShouldBeNotEmpty_IfHasFacilityCodeAndParentCode(string facilityCode, string parentCode)
        {
            // Arrange
            var parent = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            var child = fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            child.Fields.Add(Constants.Fields.DatasourceItem.Code, facilityCode);
            parent.Fields.Add(Constants.Fields.DatasourceItem.Code, parentCode);
            parent.Children.Add(child);

            db.Add(parent);

            // Act
            var actual = new FacilityType(db.GetItem(child.ID));

            // Assert
            actual.Code.Should().NotBeNullOrEmpty();
        }
    }
}
