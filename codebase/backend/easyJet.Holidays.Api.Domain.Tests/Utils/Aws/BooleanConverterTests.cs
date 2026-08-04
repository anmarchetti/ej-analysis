using Amazon.DynamoDBv2.DocumentModel;
using easyJet.Holidays.Api.Domain.Utils.Aws;
using FluentAssertions;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Utils.Aws;

public class BooleanConverterTests
{
    private readonly BooleanConverter _sut;

    public BooleanConverterTests()
    {
        _sut = new();
    }

    [Theory]
    [InlineData(true, "true")]
    [InlineData(false, "false")]
    public void ToEntry_ReturnsPrimitiveWithLowercaseString(bool value, string expected)
    {
        // Act
        var result = _sut.ToEntry(value);

        // Assert
        result.Should().BeOfType<Primitive>()
            .Which.Value.Should().Be(expected);
    }

    [Theory]
    [InlineData("true", true)]
    [InlineData("false", false)]
    [InlineData("True", true)]
    [InlineData("False", false)]
    public void FromEntry_ValidBoolString_ReturnsBoolean(string raw, bool expected)
    {
        // Arrange
        var entry = new Primitive(raw);

        // Act
        var result = _sut.FromEntry(entry);

        // Assert
        result.Should().Be(expected);
    }

    [Fact]
    public void FromEntry_InvalidString_ThrowsArgumentException()
    {
        // Arrange
        var entry = new Primitive("notabool");

        // Act
        var act = () => _sut.FromEntry(entry);

        // Assert
        act.Should().Throw<ArgumentException>()
            .WithMessage("*cannot be converted to boolean*");
    }
}
