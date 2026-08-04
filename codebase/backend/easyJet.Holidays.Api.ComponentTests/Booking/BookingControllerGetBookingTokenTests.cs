using easyJet.Holidays.Api.ComponentTests.Infrastructure;
using easyJet.Holidays.Tests.Domain.ComponentTests;
using FluentAssertions;
using System.Text;
using Xunit;

namespace easyJet.Holidays.Api.ComponentTests.Booking;

public class BookingControllerGetBookingTokenTests : BaseFixtureAwareComponentTest
{
    public BookingControllerGetBookingTokenTests(WebApplicationFixture webApp) : base(webApp)
    {
    }

    [Fact]
    public async Task GetBookingTokenValidInput_ShouldReturnToken()
    {
        // Arrange
        var contentToPost =
            new StringContent(
                "{\"bookingReference\":\"70104159\",\"lastName\":\"Test\",\"date\":\"2023-01-12T09:31:58.809Z\",\"supplierId\":\"99999\"}",
                Encoding.UTF8,
                "application/json");

        // Act
        var result = await Client.PostAsync("/api/v1.0/booking/token", contentToPost);

        // Assert
        const string expectedTokenInWindows = "5f3fd17d065219db209130e2985c0488d003da1713f38e2aeb831f09c9b667c923830f44db144ef374b0c3f902f49add";
        const string expectedTokenInLinux = "5b4a06a803cf6f08cae2d41bbc128ea188d7ca12ecf0658715dbaa85deed0da2cc4a20969cda18c5605aae6e90e14037";
        var responseContent = await result.Content.ReadAsStringAsync();

        responseContent.Should().BeOneOf(expectedTokenInWindows, expectedTokenInLinux);
    }
}