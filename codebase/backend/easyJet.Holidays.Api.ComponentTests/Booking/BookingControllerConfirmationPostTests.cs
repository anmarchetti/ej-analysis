using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.ComponentTests.Infrastructure;
using easyJet.Holidays.Api.Controllers.Booking;
using easyJet.Holidays.Tests.Domain.ComponentTests;
using easyJet.Holidays.Tests.Domain.Integration;
using FluentAssertions;
using Newtonsoft.Json;
using System.Net;
using Xunit;

namespace easyJet.Holidays.Api.ComponentTests.Booking;

/// <summary>
/// Component tests for <see cref="BookingController"/> POST confirmation endpoint
/// </summary>
public class BookingControllerConfirmationPostTests : BaseFixtureAwareComponentTest
{
    private const string ConfirmationUrl = "/api/v1.0/booking/confirmation";

    public BookingControllerConfirmationPostTests(WebApplicationFixture webApp) : base(webApp)
    {
    }

    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/booking/confirmation")]
    [Theory]
    [InlineData("Valid data", "VALID_REF", "Johnson", "2020-01-01", HttpStatusCode.OK)]
    [InlineData("Invalid booking reference", "", "LastName", "2020-01-01", HttpStatusCode.BadRequest)]
    [InlineData("Invalid last name", "VALID_REF", "", "2020-01-01", HttpStatusCode.BadRequest)]
    public async Task ConfirmationPost_Validate_RequestArguments(string because, string bookingReference, string lastName, string date, HttpStatusCode status)
    {
        // Arrange
        var body = JsonConvert.SerializeObject(new { bookingReference, lastName, date });

        // Act
        var response = await Client.PostAsync(ConfirmationUrl, ComponentTestUtils.GetJsonContent(body));

        // Assert
        response.StatusCode.Should().Be(status, because);
    }

    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/booking/confirmation")]
    [Theory]
    [InlineData("Invalid reference", "INVALID_REF", "Johnson", "2020-01-01", HttpStatusCode.BadRequest)]
    [InlineData("Invalid last name", "VALID_REF", "JJohnson", "2020-01-01", HttpStatusCode.BadRequest)]
    [InlineData("Invalid date", "VALID_REF", "Johnson", "3020-01-01", HttpStatusCode.BadRequest)]
    public async Task ConfirmationPost_InvalidData_ThrowError(string because, string bookingReference, string lastName, string date, HttpStatusCode status)
    {
        // Arrange
        var body = JsonConvert.SerializeObject(new { bookingReference, lastName, date });

        // Act
        var response = await Client.PostAsync(ConfirmationUrl, ComponentTestUtils.GetJsonContent(body));

        // Assert
        await response.AssertErrorResponse(ApiExceptionCodes.DfloGetDocumentsError, status, because);
    }

    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/booking/confirmation")]
    [Theory]
    [InlineData("VALID_REF", "Johnson", "2020-01-01")]
    public async Task ConfirmationPost_TwoAmendments_ReturnLast(string bookingReference, string lastName, string date)
    {
        // Arrange
        var expected = await File.ReadAllTextAsync(Path.Combine(Directory.GetCurrentDirectory(), "__admin", "files", "dFlo", "confirmation.response"));
        var body = JsonConvert.SerializeObject(new { bookingReference, lastName, date });

        // Act
        var response = await Client.PostAsync(ConfirmationUrl, ComponentTestUtils.GetJsonContent(body));
        var content = await response.Content.ReadAsStringAsync();

        // Assert
        response.Content.Headers.ContentType?.ToString().Should().Be("application/pdf");
        content.Should().Be(expected);
    }
}
