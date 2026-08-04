using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.External.Atcom.Mappers.Guests;
using FluentAssertions;
using System.Collections;
using Xunit;
using Person = easyJet.Holidays.Api.Domain.Data.Guests.Person;

namespace easyJet.Holidays.External.Atcom.Tests.Mappers.Guests
{
    public class GuestsMapperTests
    {
        private readonly List<Person> _orderedGuests = [new(), new()];
        
        [Theory]
        [ClassData(typeof(GuestsMapperTestData))]
        public void MapLeadPassenger_WithoutPassenger_ShouldReturnEmptyPerson(LeadPassenger leadPassenger)
        {
            // Act
            var actual = GuestsMapper.MapLeadPassenger(leadPassenger);

            // Assert
            actual.Should().NotBeNull();
        }
        
        [Fact]
        public void MapRoutePax_ShouldIncludeExternalRefId_WhenFlightHasPNR()
        {
            // Arrange
            const string pnr = "123456";
            const string system = "EZY";

            var paxs = new RoutePax[]{ new() { ExternalPNR = pnr, }, new() { ExternalPNR = pnr }};
            
            // Act
            var actual = GuestsMapper.MapRoutePax(_orderedGuests, paxs);

            // Assert
            actual.Length.Should().Be(_orderedGuests.Count);
            actual[0].Ext_Ref_Id.Code.Should().Be(pnr);
            actual[0].Ext_Ref_Id.System.Should().Be(system);
            actual[1].Ext_Ref_Id.Code.Should().Be(pnr);
            actual[1].Ext_Ref_Id.System.Should().Be(system);
        }
        
        [Fact]
        public void MapRoutePax_ShouldNotIncludeExternalRefId_WhenFlightHasNoPNR()
        {
            // Arrange
            var paxs = new RoutePax[] {new (), new()};
            
            // Act
            var actual = GuestsMapper.MapRoutePax(_orderedGuests, paxs);

            // Assert
            actual.Length.Should().Be(_orderedGuests.Count);
            actual[0].Ext_Ref_Id.Should().BeNull();
            actual[1].Ext_Ref_Id.Should().BeNull();
        }
        
        [Fact]
        public void MapRoutePax_ShouldNotIncludeExternalRefId_WhenFlightHasEmptyPNR()
        {
            // Arrange
            var paxs = new RoutePax[] {new () { ExternalPNR = string.Empty, }, new () { ExternalPNR = string.Empty }};
            
            // Act
            var actual = GuestsMapper.MapRoutePax(_orderedGuests, paxs);

            // Assert
            actual.Length.Should().Be(_orderedGuests.Count);
            actual[0].Ext_Ref_Id.Should().BeNull();
            actual[1].Ext_Ref_Id.Should().BeNull();
        }
        
        [Fact]
        public void MapRoutePax_ShouldNotIncludeExternalRefId_WhenPaxsAreEmpty()
        {
            // Arrange
            var emptyOrderedGuests = new List<Person>();
            var paxs = Array.Empty<RoutePax>();
            
            // Act
            var actual = GuestsMapper.MapRoutePax(emptyOrderedGuests, paxs);

            // Assert
            actual.Length.Should().Be(0);
        }
        
                
        [Fact]
        public void MapRoutePax_ShouldNotIncludeExternalRefId_WhenPaxsAreNull()
        {
            // Arrange
            var emptyOrderedGuests = new List<Person>();
            
            // Act
            var actual = GuestsMapper.MapRoutePax(emptyOrderedGuests, null);

            // Assert
            actual.Length.Should().Be(0);
        }
    }

    public class GuestsMapperTestData : IEnumerable<object[]>
    {
        public IEnumerator<object[]> GetEnumerator()
        {
            yield return new object[] { null };
        }

        IEnumerator IEnumerable.GetEnumerator() => GetEnumerator();
    }
}
