using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Data.Luggage;
using easyJet.Holidays.Api.Domain.Utils;
using FluentAssertions;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Utils;

public class LuggageUtilsTests
{
    private const string DefaultBagCode = "LUG";
    private readonly List<PersonWithDetails> _guests =
    [
        new() { Type = PersonType.Adult },
        new() { Type = PersonType.Child },
        new() { Type = PersonType.Infant }
    ];

    [Fact]
    public void GetLuggagePrice_ReturnsZeroIfNull()
    {
        var result = LuggageUtils.GetLuggagePrice(null);
        result.Should().Be(0);
    }

    [Fact]
    public void GetLuggagePrice_ReturnsZeroIfEmpty()
    {
        var result = LuggageUtils.GetLuggagePrice(new ExtraLuggageInfo());
        result.Should().Be(0);
    }

    [Fact]
    public void GetLuggagePrice_ReturnsZeroForDefaultBags()
    {
        var luggageInfo = new ExtraLuggageInfo
        {
            Items = new List<ExtraLuggageItem>
            {
                new()
                {
                    RouteId = "1",
                    PassengerId = "1",
                    ItemCode = DefaultBagCode,
                    Quantity = 1,
                    Price = 10,
                    IsComplimentary = true
                },
                new()
                {
                    RouteId = "2",
                    PassengerId = "1",
                    ItemCode = DefaultBagCode,
                    Quantity = 1,
                    Price = 10,
                    IsComplimentary = true
                }
            }
        };

        var result = LuggageUtils.GetLuggagePrice(luggageInfo);
        result.Should().Be(0);
    }

    [Fact]
    public void GetLuggagePrice_ReturnsCorrectValueForExtraDefaultBags()
    {
        var luggageInfo = new ExtraLuggageInfo
        {
            Items = new List<ExtraLuggageItem>
            {
                new()
                {
                    RouteId = "1",
                    PassengerId = "1",
                    ItemCode = DefaultBagCode,
                    Quantity = 2,
                    Price = 10,
                    IsComplimentary = true
                },
                new()
                {
                    RouteId = "1",
                    PassengerId = "1",
                    ItemCode = "LUGE",
                    Quantity = 1,
                    Price = 10,
                    IsComplimentary = false
                },
                new()
                {
                    RouteId = "2",
                    PassengerId = "1",
                    ItemCode = DefaultBagCode,
                    Quantity = 2,
                    Price = 10,
                    IsComplimentary = true
                },
                new()
                {
                    RouteId = "2",
                    PassengerId = "1",
                    ItemCode = "LUGE",
                    Quantity = 2,
                    Price = 10,
                    IsComplimentary = false
                }
            }
        };

        var result = LuggageUtils.GetLuggagePrice(luggageInfo);
        result.Should().Be(30);
    }

    [Fact]
    public void GetLuggagePrice_ReturnsCorrectValueForNonDefaultBags()
    {
        var luggageInfo = new ExtraLuggageInfo
        {
            Items = new List<ExtraLuggageItem>
            {
                new()
                {
                    RouteId = "1",
                    PassengerId = "1",
                    ItemCode = "LUSE",
                    Quantity = 2,
                    Price = 10,
                    IsComplimentary = false
                },
                new()
                {
                    RouteId = "2",
                    PassengerId = "1",
                    ItemCode = "BIKE",
                    Quantity = 3,
                    Price = 10,
                    IsComplimentary = false
                }
            }
        };

        var result = LuggageUtils.GetLuggagePrice(luggageInfo);
        result.Should().Be(50);
    }

    [Fact]
    public void GetLuggagePricePerPerson_ReturnsCorrectValue()
    {
        var luggageInfo = new ExtraLuggageInfo
        {
            Items = new List<ExtraLuggageItem>
            {
                new()
                {
                    RouteId = "1",
                    PassengerId = "1",
                    ItemCode = "LUSE",
                    Quantity = 2,
                    Price = 10,
                    IsComplimentary = false
                },
                new()
                {
                    RouteId = "2",
                    PassengerId = "1",
                    ItemCode = "BIKE",
                    Quantity = 3,
                    Price = 10,
                    IsComplimentary = false
                },
                new()
                {
                    RouteId = "1",
                    PassengerId = "2",
                    ItemCode = DefaultBagCode,
                    Quantity = 2,
                    Price = 10,
                    IsComplimentary = true
                },
                new()
                {
                    RouteId = "2",
                    PassengerId = "2",
                    ItemCode = DefaultBagCode,
                    Quantity = 2,
                    Price = 10,
                    IsComplimentary = true
                },
                new()
                {
                    RouteId = "2",
                    PassengerId = "2",
                    ItemCode = "LUGE",
                    Quantity = 1,
                    Price = 10,
                    IsComplimentary = false
                }
            }
        };

        var result = LuggageUtils.GetLuggagePricePerPerson(luggageInfo, _guests);
        result.Should().Be(30);
    }

    [Theory]
    [InlineData("ba", LuggageType.Bag)]
    [InlineData("SPORTEEQUIPMENT", LuggageType.SportsEquipment)]
    [InlineData("", LuggageType.SportsEquipment)]
    [InlineData(null, LuggageType.Bag)]
    public void CheckLuggageType_ReturnsIncorrectValues(string categoryTypeAsString, LuggageType type)
    {
        var result = LuggageUtils.CheckLuggageType(categoryTypeAsString, type);

        Assert.False(result);
    }

    [Theory]
    [InlineData("BAG", LuggageType.Bag)]
    [InlineData("bag", LuggageType.Bag)]
    [InlineData("SPORTS EQUIPMENT", LuggageType.SportsEquipment)]
    [InlineData("sports Equipment", LuggageType.SportsEquipment)]
    public void CheckLuggageType_GetCorrectLuggageType(string categoryTypeAsString, LuggageType type)
    {
        var result = LuggageUtils.CheckLuggageType(categoryTypeAsString, type);

        Assert.True(result);
    }

    [Fact]
    public void GetLuggageCategoryByType_GetEmptyListForNullLuggageCategories()
    {
        var result = LuggageUtils.GetLuggageCategoryByType(null, LuggageType.Bag);

        Assert.Empty(result);
    }

    [Theory]
    [InlineData("BAG", LuggageType.Bag)]
    [InlineData("SPORTS EQUIPMENT", LuggageType.SportsEquipment)]
    public void GetLuggageCategoryByType_GetLuggageCategoryByCorrectType(string categoryTypeAsString, LuggageType type)
    {
        var luggageCategories = new List<Domain.Data.ReferenceData.Luggage.LuggageCategory>()
        {
            new()
            {
                Type = "BAG"
            },
            new()
            {
                Type = "SPORTS EQUIPMENT"
            },
        };

        var result = LuggageUtils.GetLuggageCategoryByType(luggageCategories, type).ToList();

        Assert.NotNull(result);
        Assert.Single(result);
        Assert.Equal(categoryTypeAsString, result.First().Type);
    }
}