using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.RoomVariants;
using easyJet.Holidays.Api.Domain.Utils;
using FluentAssertions;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Luggage;

public class AncillariesExtensionsTests
{
    #region BuildGuests from BaseSearchRequest

    [Fact]
    [Trait("Source", "BaseSearchRequest")]
    public void BuildGuests_FromSearchRequest_WhenRoomIsNull_ShouldReturnEmpty()
    {
        var request = new AccommodationOfferRequest { Room = null };
        request.BuildGuests().Should().BeEmpty();
    }

    [Fact]
    [Trait("Source", "BaseSearchRequest")]
    public void BuildGuests_WhenRoomIsEmpty_ShouldReturnEmpty()
    {
        var request = new AccommodationOfferRequest { Room = new List<RoomAllocation>() };
        request.BuildGuests().Should().BeEmpty();
    }

    [Fact]
    [Trait("Source", "BaseSearchRequest")]
    public void BuildGuests_WhenRoomHasMixedGuests_ShouldReturnCorrectGuests()
    {
        // Arrange
        var request = new AccommodationOfferRequest
        {
            Room = new List<RoomAllocation> { new() { Adults = 1, Children = 1, Infants = 1 } }
        };

        // Act
        var result = request.BuildGuests().ToList();

        // Assert
        result.Should().HaveCount(3);
        result.Should().Contain(g => g.Type == PersonType.Adult && g.Index == "1");
        result.Should().Contain(g => g.Type == PersonType.Child && g.Index == "2");
        result.Should().Contain(g => g.Type == PersonType.Infant && g.Index == "3");
    }

    [Fact]
    [Trait("Source", "BaseSearchRequest")]
    public void BuildGuests_WhenMultipleRooms_ShouldReturnCorrectGuestsForAllRooms()
    {
        // Arrange
        var request = new AccommodationOfferRequest
        {
            Room = new List<RoomAllocation>
            {
                new () { Adults = 1, Children = 1, Infants = 1 },
                new () { Adults = 2, Children = 0, Infants = 1 }
            }
        };

        // Act
        var result = request.BuildGuests().ToList();

        // Assert
        result.Should().HaveCount(6);
        result.Should().Contain(g => g.Type == PersonType.Adult && g.Index == "1");
        result.Should().Contain(g => g.Type == PersonType.Child && g.Index == "2");
        result.Should().Contain(g => g.Type == PersonType.Infant && g.Index == "3");
        result.Should().Contain(g => g.Type == PersonType.Adult && g.Index == "1");
        result.Should().Contain(g => g.Type == PersonType.Adult && g.Index == "2");
        result.Should().Contain(g => g.Type == PersonType.Infant && g.Index == "3");
    }

    #endregion

    #region BuildGuests from Offer

    [Fact]
    [Trait("Source", "Offer")]
    public void BuildGuests_WhenAccomIsNull_ShouldReturnEmpty()
    {
        ((Offer)null).BuildGuests().Should().BeEmpty();
    }

    [Fact]
    [Trait("Source", "Offer")]
    public void BuildGuests_WhenAccomIsEmpty_ShouldReturnEmpty()
    {
        new Offer().BuildGuests().Should().BeEmpty();
    }

    [Fact]
    [Trait("Source", "Offer")]
    public void BuildGuests_WhenAccomUnitIsEmpty_ShouldReturnEmpty()
    {
        var offer = new Offer { Accom = new Accom { Unit = new List<Unit>() } };
        offer.BuildGuests().Should().BeEmpty();
    }

    [Fact]
    [Trait("Source", "Offer")]
    public void BuildGuests_WhenAccomHasMixedGuests_ShouldReturnCorrectGuests()
    {
        // Arrange
        var offer = new Offer
        {
            Accom = new Accom
            {
                Unit = new List<Unit>
                {
                    new() { Occupation = new Occupation { Adults = 1, Children = 1, Infants = 1 } }
                }
            }
        };

        // Act
        var result = offer.BuildGuests().ToArray();

        // Assert
        result.Should().HaveCount(3);
        result.Should().Contain(g => g.Type == PersonType.Adult && g.Index == "1");
        result.Should().Contain(g => g.Type == PersonType.Child && g.Index == "2");
        result.Should().Contain(g => g.Type == PersonType.Infant && g.Index == "3");
    }

    #endregion

    #region ParseLuggage

    [Fact]
    public void ParseLuggage_WhenLuggageIsNull_ShouldReturnEmpty()
    {
        // Arrange
        var request = new AccommodationOfferRequest { Luggage = null };

        // Act
        var actual = request.ParseLuggage().ToList();

        // Assert
        actual.Should().BeEmpty();
    }

    [Fact]
    public void ParseLuggage_WhenLuggageIsEmpty_ShouldReturnEmpty()
    {
        // Arrange
        var request = new AccommodationOfferRequest { Luggage = new List<string>() };

        // Act
        var result = request.ParseLuggage().ToList();

        // Assert
        result.Should().BeEmpty();
    }

    [Fact]
    public void ParseLuggage_WhenAdultLuggageIsValid_ShouldReturnCorrectAdultLuggage()
    {
        // Arrange
        var request = new AccommodationOfferRequest
        {
            Luggage = new List<string> { "LUGE-2|LUSE-1" }
        };

        // Act
        var result = request.ParseLuggage().ToList();

        // Assert
        result.Should().HaveCount(3);
        result.Should().Contain(("LUGE", PersonType.Adult));
        result.Should().Contain(("LUGE", PersonType.Adult));
        result.Should().Contain(("LUSE", PersonType.Adult));
    }

    [Fact]
    public void ParseLuggage_WhenChildrenLuggageIsValid_ShouldReturnCorrectChildrenLuggage()
    {
        // Arrange
        var request = new AccommodationOfferRequest
        {
            Luggage = new List<string> { "", "LUGE-1|BIKE-2" }
        };

        // Act
        var result = request.ParseLuggage().ToList();

        // Assert
        result.Should().HaveCount(3);
        result.Should().Contain(("LUGE", PersonType.Child));
        result.Should().Contain(("BIKE", PersonType.Child));
        result.Should().Contain(("BIKE", PersonType.Child));
    }

    [Fact]
    public void ParseLuggage_WhenInfantLuggageIsValid_ShouldReturnCorrectInfantLuggage()
    {
        // Arrange
        var request = new AccommodationOfferRequest
        {
            Luggage = new List<string> { "", "", "LUGE-1|CANO-1" }
        };

        // Act
        var result = request.ParseLuggage().ToList();

        // Assert
        result.Should().HaveCount(2);
        result.Should().Contain(("LUGE", PersonType.Infant));
        result.Should().Contain(("CANO", PersonType.Infant));
    }

    [Fact]
    public void ParseLuggage_WhenAllLuggageTypesAreValid_ShouldReturnCorrectLuggageForAllTypes()
    {
        // Arrange
        var request = new AccommodationOfferRequest
        {
            Luggage = new List<string> { "LUGE-2", "LUSE-1", "BIKE-3" }
        };

        // Act
        var result = request.ParseLuggage().ToList();

        // Assert
        result.Should().HaveCount(6);
        result.Should().Contain(("LUGE", PersonType.Adult));
        result.Should().Contain(("LUGE", PersonType.Adult));
        result.Should().Contain(("LUSE", PersonType.Child));
        result.Should().Contain(("BIKE", PersonType.Infant));
        result.Should().Contain(("BIKE", PersonType.Infant));
        result.Should().Contain(("BIKE", PersonType.Infant));
    }

    [Fact]
    public void ParseLuggage_WhenLuggageFormatIsInvalid_ShouldThrowFormatException()
    {
        // Arrange
        var request = new AccommodationOfferRequest
        {
            Luggage = new List<string> { "LUGE-2", "LUSE-X" }
        };

        // Act
        Action act = () => request.ParseLuggage().ToList();

        // Assert
        act.Should().Throw<FormatException>().WithMessage("Invalid format for luggage: LUSE-X");
    }

    #endregion
}