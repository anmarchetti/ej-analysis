using AutoFixture.Xunit3;
using easyJet.Holidays.Api.ComponentTests.Infrastructure;
using easyJet.Holidays.Api.Controllers.Booking;
using easyJet.Holidays.Tests.Domain.ComponentTests;
using FluentAssertions;
using Xunit;

namespace easyJet.Holidays.Api.ComponentTests.Content;

/// <summary>
/// Component tests for <see cref="BookingController"/>
/// </summary>
public class ContentControllerTests : BaseFixtureAwareComponentTest
{
    public ContentControllerTests(WebApplicationFixture webApp) : base(webApp)
    {
    }

    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/booking")]
    [Theory]
    [InlineAutoData("Before 1st Feb", "2020-02-01", "Shared for Accom <strong>before 1st Feb</strong>.")]
    [InlineAutoData("After 1st Feb", "2020-02-02", "Shared for Accom <strong>after 1st Feb</strong>.")]
    public async Task Display_InvalidData_ThrowError(string because, string date, string expected)
    {
        // Arrange 
        var query = $"/api/v1.0/content/transfer-content?transferCode=X9098104PFOS&depDate={date}&airportCode=PMI&accomm=WITH_TRANSFER_CONTENT";

        // Act
        var response = await Client.GetAsync(query);
        var content = await response.Content.ReadAsStringAsync();

        // Assert
        content.Should().Be(expected, because);
    }
}