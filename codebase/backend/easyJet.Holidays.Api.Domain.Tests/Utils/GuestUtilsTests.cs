using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Utils;
using FluentAssertions;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Utils;

public class GuestUtilsTests
{
    private static List<PersonWithDetails> Guests0 = new()
    {
        new() { Type = PersonType.Infant }
    };

    private static List<PersonWithDetails> Guests1 = new()
    {
        new() { Type = PersonType.Adult },
        new() { Type = PersonType.Infant }
    };

    private static List<PersonWithDetails> Guests2 = new()
    {
        new() { Type = PersonType.Adult },
        new() { Type = PersonType.Child },
        new() { Type = PersonType.Infant }
    };

    private static List<PersonWithDetails> Guests3 = new()
    {
        new() { Type = PersonType.Adult },
        new() { Type = PersonType.Adult },
        new() { Type = PersonType.Adult }
    };

    public static IEnumerable<object[]> GetNonInfantsCountTestData = new List<object[]>
    {
        new object[] { null, 0 },
        new object[] { new List<PersonWithDetails>(), 0 },
        new object[] { Guests0, 0 },
        new object[] { Guests1, 1 },
        new object[] { Guests2, 2 },
        new object[] { Guests3, 3 }
    };

    public static IEnumerable<object[]> GetNonInfantsTestData = new List<object[]>
    {
        new object[] { null, Enumerable.Empty<PersonWithDetails>() },
        new object[] { new List<PersonWithDetails>(), Enumerable.Empty<PersonWithDetails>()},
        new object[] { Guests0, Guests0.Where(guest => guest.Type != PersonType.Infant) },
        new object[] { Guests1, Guests1.Where(guest => guest.Type != PersonType.Infant) },
        new object[] { Guests2, Guests2.Where(guest => guest.Type != PersonType.Infant) },
        new object[] { Guests3, Guests3.Where(guest => guest.Type != PersonType.Infant) }
    };

    [Theory]
    [MemberData(nameof(GetNonInfantsCountTestData))]
    public void GetNonInfantsCount_ReturnsCorrectValue(IList<PersonWithDetails> guests, int expectedValue)
    {
        var result = GuestUtils.GetNonInfantsCount(guests);
        result.Should().Be(expectedValue);
    }

    [Fact]
    public void IndexGuests_AddsIndexToEachGuest()
    {
        // Arrange
        var guests = new List<PersonWithDetails>
        {
            new() { Type = PersonType.Adult },
            new() { Type = PersonType.Child },
            new() { Type = PersonType.Adult },
            new() { Type = PersonType.Infant }
        };

        // Act
        GuestUtils.IndexGuests(guests);

        // Assert
        guests[0].Index.Should().Be("1");
        guests[1].Index.Should().Be("2");
        guests[2].Index.Should().Be("3");
        guests[3].Index.Should().Be("4");
    }

    [Theory]
    [MemberData(nameof(GetNonInfantsTestData))]
    public void GetNonInfants_ReturnsCorrectValue(IList<PersonWithDetails> guests, IEnumerable<PersonWithDetails> expectedValue)
    {
        var result = GuestUtils.GetNonInfants(guests);
        result.Should().BeEquivalentTo(expectedValue);
    }

    [Fact]
    public void SortGuests_HandlesNullInput()
    {
        var result = GuestUtils.SortGuests<PersonWithDetails>(null, guest => guest.Type);
        result.Should().BeEmpty();
    }

    [Fact]
    public void SortGuests_HandlesEmptyInput()
    {
        var result = GuestUtils.SortGuests(new List<PersonWithDetails>(), guest => guest.Type);
        result.Should().BeEmpty();
    }

    [Fact]
    public void SortGuests_ReturnsCorrectResult()
    {
        var guests = new List<PersonWithDetails>
        {
            new() { Type = PersonType.Infant },
            new() { Type = PersonType.Adult },
            new() { Type = PersonType.Child },
            new() { Type = PersonType.Adult }
        };

        var result = GuestUtils.SortGuests(guests, guest => guest.Type);
        result[0].Type.Should().Be(PersonType.Adult);
        result[1].Type.Should().Be(PersonType.Adult);
        result[2].Type.Should().Be(PersonType.Child);
        result[3].Type.Should().Be(PersonType.Infant);
    }
}