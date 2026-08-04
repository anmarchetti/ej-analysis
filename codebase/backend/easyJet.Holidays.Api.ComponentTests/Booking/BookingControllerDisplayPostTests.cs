using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.ComponentTests.Infrastructure;
using easyJet.Holidays.Api.ComponentTests.Utils;
using easyJet.Holidays.Api.Controllers.Booking;
using easyJet.Holidays.External.Atcom.Models.Booking;
using easyJet.Holidays.Tests.Domain.ComponentTests;
using easyJet.Holidays.Tests.Domain.Integration;
using FluentAssertions;
using Newtonsoft.Json;
using System.Net;
using Xunit;

namespace easyJet.Holidays.Api.ComponentTests.Booking;

/// <summary>
/// Component tests for <see cref="BookingController"/> POST retrieve endpoint
/// </summary>
public class BookingControllerDisplayPostTests : BaseFixtureAwareComponentTest
{
    private const string RetrieveUrl = "/api/v1.0/booking/retrieve";

    public BookingControllerDisplayPostTests(WebApplicationFixture webApp) : base(webApp)
    {
    }

    [Trait("Api", "/api/v1.0/booking/retrieve")]
    [Trait("Category", "Component")]
    [Fact]
    public async Task DisplayPost_ValidData_ReturnBooking()
    {
        // Arrange
        var expected = ComponentTestUtils.GetJsonString(
            @"WebApi\booking_VALID_REF_not_logged_in.json", minify: true);

        var body = JsonConvert.SerializeObject(new
        {
            bookingReference = "VALID_REF",
            lastName = "Johnson",
            date = "2020-01-01"
        });

        // Act
        var response = await Client.PostAsync(RetrieveUrl, ComponentTestUtils.GetJsonContent(body));
        var content = await response.Content.ReadAsStringAsync();

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        content.Should().BeEqualAfterNormalization<BookingResponse>(expected);
    }

    [Trait("Api", "/api/v1.0/booking/retrieve")]
    [Trait("Category", "Component")]
    [Theory]
    [InlineData("Invalid reference", "INVALID_REF", "Johnson", "2020-01-01", HttpStatusCode.BadRequest)]
    [InlineData("Invalid last name", "VALID_REF", "JJohnson", "2020-01-01", HttpStatusCode.BadRequest)]
    [InlineData("Invalid date", "VALID_REF", "Johnson", "3020-01-01", HttpStatusCode.BadRequest)]
    public async Task DisplayPost_InvalidData_ThrowError(string because, string bookingReference, string lastName, string date, HttpStatusCode status)
    {
        // Arrange
        var body = JsonConvert.SerializeObject(new
        {
            bookingReference,
            lastName,
            date
        });

        // Act
        var response = await Client.PostAsync(RetrieveUrl, ComponentTestUtils.GetJsonContent(body));

        // Assert
        await response.AssertErrorResponse(ApiExceptionCodes.BookingViewError, status, because);
    }

    [Trait("Api", "/api/v1.0/booking/retrieve")]
    [Trait("Category", "Component")]
    [Theory]
    [InlineData("Fraud detected", "FRAUD", "Johnson", "2020-01-01", HttpStatusCode.BadRequest)]
    public async Task DisplayPost_FraudCancelled_ReturnError(string because, string bookingReference, string lastName, string date, HttpStatusCode status)
    {
        // Arrange
        var body = JsonConvert.SerializeObject(new
        {
            bookingReference,
            lastName,
            date
        });

        // Act
        var response = await Client.PostAsync(RetrieveUrl, ComponentTestUtils.GetJsonContent(body));

        // Assert
        await response.AssertErrorResponse(ApiExceptionCodes.BookingFraudError, status, because);
    }

    [Trait("Api", "/api/v1.0/booking/retrieve")]
    [Trait("Category", "Component")]
    [Theory]
    [InlineData("VALID_REF", "Johnson", "2020-01-01", "S123")]
    public async Task DisplayPost_WithSupplierId_HasCommissionInResponse(string bookingReference, string lastName, string date, string supplierId)
    {
        // Arrange
        var expected = ComponentTestUtils.GetJsonString(
            @"WebApi\booking_VALID_REF_SupplierId_response.json", minify: true);

        var body = JsonConvert.SerializeObject(new
        {
            bookingReference,
            lastName,
            date,
            supplierId
        });

        // Act
        var response = await Client.PostAsync(RetrieveUrl, ComponentTestUtils.GetJsonContent(body));
        var content = await response.Content.ReadAsStringAsync();

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        content.Should().BeEqualAfterNormalization<BookingResponse>(expected);
    }
}
