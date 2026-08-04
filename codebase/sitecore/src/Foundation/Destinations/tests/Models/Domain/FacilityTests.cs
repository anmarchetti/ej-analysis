using AutoFixture;
using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.Models.Domain;
using FluentAssertions;
using Sitecore.FakeDb;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Models.Domain
{
    public class FacilityTests
    {
        private readonly Fixture fixture;
        private readonly Db db;

        public FacilityTests()
        {
            fixture = new Fixture();
            db = fixture.Freeze<Db>();
        }

        [Fact]
        public void FacilityConstructor_ShouldNotSetValues_IfItemNull()
        {
            // Act
            var actual = new Facility(null);

            // Assert
            actual.GroupCode.Should().BeNull();
        }

        [Fact]
        public void FacilityConstructor_ShouldNotSetValue_IfFieldNull()
        {
            // Arrange
            var item = fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            db.Add(item);

            // Act
            var actual = new Facility(db.GetItem(item.ID));

            // Assert
            actual.GroupCode.Should().BeNull();
        }

        [Theory]
        [AutoData]
        public void FacilityConstructor_ShouldSetValue_IfItemParentHasField(string code)
        {
            // Arrange
            var parentItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            parentItem.Fields.Add(Constants.Fields.DatasourceItem.Code, code);

            var item = fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            parentItem.Children.Add(item);
            db.Add(parentItem);

            // Act
            var actual = new Facility(db.GetItem(item.ID));

            // Assert
            actual.GroupCode.Should().BeEquivalentTo(code);
        }
    }
}
