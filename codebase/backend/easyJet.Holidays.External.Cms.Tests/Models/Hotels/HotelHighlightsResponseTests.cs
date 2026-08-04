using easyJet.Holidays.External.Cms.Models.Hotels;
using FluentAssertions;
using Xunit;

namespace easyJet.Holidays.External.Cms.Tests.Models.Hotels;

public class HotelHighlightsResponseTests
{
    [Fact]
    public void ApiErrors_Should_Always_Return_Null()
    {
        // Arrange & Act
        var response = new HotelHighlightsResponse();

        // Assert
        response.ApiErrors.Should().BeNull();
    }
}