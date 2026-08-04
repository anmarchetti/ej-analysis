using AutoFixture;
using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.Models.Domain;
using FluentAssertions;
using Sitecore.FakeDb;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Models.Domain
{
    public class HotelRoomStayTests
    {
        private readonly Fixture fixture;
        private readonly Db db;

        public HotelRoomStayTests()
        {
            fixture = new Fixture();
            db = fixture.Freeze<Db>();
        }

        [Fact]
        public void HotelRoomStayConstructor_ShouldNotSetValues_IfFieldsNotExist()
        {
            // Arrange
            var item = fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            db.Add(item);

            // Act
            var actual = new HotelRoomStay(db.GetItem(item.ID));

            // Assert
            actual.StayType.Should().BeNull();
            actual.Description.Should().BeNull();
            actual.Order.Should().BeNull();
        }

        [Theory]
        [AutoData]
        public void HotelRoomStayConstructor_ShouldSetValues_IfFieldsExist(string stayType, string description, string order)
        {
            // Arrange
            var item = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            item.Fields.Add(Constants.Fields.RoomStayItem.StayType, stayType);
            item.Fields.Add(Constants.Fields.RoomStayItem.Description, description);
            item.Fields.Add(Constants.Fields.RoomStayItem.Order, order);

            db.Add(item);

            // Act
            var actual = new HotelRoomStay(db.GetItem(item.ID));

            // Assert
            actual.StayType.Should().BeEquivalentTo(stayType);
            actual.Description.Should().BeEquivalentTo(description);
            actual.Order.Should().BeEquivalentTo(order);
        }
    }
}
