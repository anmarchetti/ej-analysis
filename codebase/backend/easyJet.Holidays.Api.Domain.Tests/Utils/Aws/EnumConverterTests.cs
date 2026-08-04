using Amazon.DynamoDBv2.DocumentModel;
using easyJet.Holidays.Api.Domain.Utils.Aws;
using FluentAssertions;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Utils.Aws;

public class EnumConverterTests
{
    private readonly EnumConverter<DayOfWeek> _sut;

    public EnumConverterTests()
    {
        _sut = new();
    }

    [Theory]
    [InlineData("Monday", DayOfWeek.Monday)]
    [InlineData("Friday", DayOfWeek.Friday)]
    public void FromEntry_ValidString_ReturnsParsedEnum(string raw, DayOfWeek expected)
    {
        // Arrange
        var entry = new Primitive(raw);

        // Act
        var result = _sut.FromEntry(entry);

        // Assert
        result.Should().Be(expected);
    }

    [Fact]
    public void FromEntry_EmptyString_ThrowsArgumentOutOfRangeException()
    {
        // Arrange
        var entry = new Primitive(string.Empty);

        // Act
        var act = () => _sut.FromEntry(entry);

        // Assert
        act.Should().Throw<ArgumentOutOfRangeException>();
    }

    [Fact]
    public void FromEntry_NullEntry_ThrowsArgumentOutOfRangeException()
    {
        // Arrange – null entry means the as-cast yields null
        // Act
        var act = () => _sut.FromEntry(null!);

        // Assert
        act.Should().Throw<ArgumentOutOfRangeException>();
    }

    [Fact]
    public void FromEntry_UnrecognisedString_ThrowsArgumentException()
    {
        // Arrange
        var entry = new Primitive("NotADay");

        // Act
        var act = () => _sut.FromEntry(entry);

        // Assert
        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void ToEntry_ValidEnum_ReturnsPrimitiveWithEnumName()
    {
        // Arrange
        const DayOfWeek day = DayOfWeek.Wednesday;

        // Act
        var result = _sut.ToEntry(day);

        // Assert
        result.Should().BeOfType<Primitive>()
            .Which.Value.Should().Be("Wednesday");
    }

    [Fact]
    public void ToEntry_Null_ThrowsArgumentOutOfRangeException()
    {
        // Arrange – null cannot be cast to Enum
        // Act
        var act = () => _sut.ToEntry(null!);

        // Assert
        act.Should().Throw<ArgumentOutOfRangeException>();
    }
}
