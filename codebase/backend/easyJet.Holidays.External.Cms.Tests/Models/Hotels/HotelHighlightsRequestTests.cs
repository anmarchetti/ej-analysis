using easyJet.Holidays.External.Cms.Models.Hotels;
using FluentAssertions;
using Xunit;

namespace easyJet.Holidays.External.Cms.Tests.Models.Hotels;

public class HotelHighlightsRequestTests
{
    [Fact]
    public void Method_Should_Always_Return_HttpGet()
    {
        // Arrange
        var request = new HotelHighlightsRequest();

        // Act
        var method = request.Method;

        // Assert
        method.Should().Be(HttpMethod.Get);
    }
}