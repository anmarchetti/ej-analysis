using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Mappers.Builders;
using FluentAssertions;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Mappers.Builders
{
    public class RoomAllocationBuilderTests
    {
        private readonly Unit _unit;
        public RoomAllocationBuilderTests()
        {
            _unit = new Unit
            {
                Occupation = new Occupation
                {
                    Adults = 2
                },
                Code = "DB01"
            };
        }

        [Fact]
        public void Create_ValidUnitWithRoom_Success()
        {
            // Arrange
            //Act
            var result = RoomAllocationBuilder.Create(_unit);

            // Assert
            result.Adults.Should().Be(2);
            result.RoomCode.Should().BeEquivalentTo("DB01");
        }

        [Fact]
        public void Create_ValidUnitWithoutRoom_Success()
        {
            // Arrange
            //Act
            var result = RoomAllocationBuilder.Create(_unit, false);

            // Assert
            result.Adults.Should().Be(2);
            result.RoomCode.Should().BeNull();
        }
    }
}
