using AutoFixture;
using easyJet.Foundation.Destinations.Models.Domain;
using FluentAssertions;
using Sitecore.FakeDb;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Models.Domain
{
    public class FacilityExtendedTests
    {
        private readonly Fixture fixture;
        private readonly Db db;

        public FacilityExtendedTests()
        {
            fixture = new Fixture();
            db = fixture.Freeze<Db>();
        }

        [Fact]
        public void FacilityExtended_ShouldSetItemID_IfItemNotNull()
        {
            // Arrange
            var item = fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            db.Add(item);

            // Act
            var actual = new FacilityExtended(db.GetItem(item.ID));

            // Assert
            actual.ItemID.Should().Be(item.ID.Guid);
        }
    }
}
