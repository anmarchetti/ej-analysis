using AutoFixture.Xunit3;
using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.ComponentTests.Infrastructure;
using easyJet.Holidays.Api.Controllers.Booking;
using easyJet.Holidays.Tests.Domain;
using easyJet.Holidays.Tests.Domain.ComponentTests;
using FluentAssertions;
using System.Net;
using Xunit;


namespace easyJet.Holidays.Api.ComponentTests.Booking;

/// <summary>
/// Component tests for <see cref="BookingController"/>
/// </summary>
public class BookingControllerDisplayStatusTests : BaseFixtureAwareComponentTest
{
    public BookingControllerDisplayStatusTests(WebApplicationFixture webApp) : base(webApp)
    {
    }

    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/booking/state")]
    [Theory]
    [InlineAutoData("Valid data", "VALID_REF", "Johnson", "2020-01-01", HttpStatusCode.OK)]
    [InlineAutoData("Invalid booking reference", "", "LastName", "2020-01-01", HttpStatusCode.BadRequest)]
    [InlineAutoData("Invalid last name", "VALID_REF", "", "2020-01-01", HttpStatusCode.BadRequest)]
    [InlineAutoData("No date", "VALID_REF", "LastName", "", HttpStatusCode.BadRequest)]
    [InlineAutoData("Invalid date", "VALID_REF", "LastName", "date2020-01-01", HttpStatusCode.BadRequest)]
    public async Task DisplayStatus_Validate_RequestArguments(string because, string bookingReference, string lastName, string date, HttpStatusCode status)
    {
        // Arrange 
        var query = $"/api/v1.0/booking/state?BookingReference={bookingReference}&lastName={lastName}&date={date}";

        // Act
        var response = await Client.GetAsync(query);

        // Assert            
        response.StatusCode.Should().Be(status, because);
    }

    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/booking/state")]
    [Theory]
    [InlineAutoData("Invalid reference", "INVALID_REF", "Johnson", "2020-01-01", HttpStatusCode.BadRequest)]
    [InlineAutoData("Invalid last name", "VALID_REF", "JJohnson", "2020-01-01", HttpStatusCode.BadRequest)]
    [InlineAutoData("Invalid date", "VALID_REF", "Johnson", "3020-01-01", HttpStatusCode.BadRequest)]
    public async Task DisplayStatus_InvalidData_ThrowError(string because, string bookingReference, string lastName, string date, HttpStatusCode status)
    {
        // Arrange 
        var query = $"/api/v1.0/booking/state?bookingReference={bookingReference}&lastName={lastName}&date={date}";

        // Act
        var response = await Client.GetAsync(query);

        // Assert            
        await response.AssertErrorResponse(ApiExceptionCodes.BookingViewError, status, because);
    }

    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/booking/state")]
    [Theory]
    [InlineAutoData("VALID_REF", "Johnson", "2020-01-01")]
    public async Task DisplayStatus_ValidData_ReturnBookingStatus(string bookingReference, string lastName, string date)
    {
        // Arrange 
        var expected = ObjectUtils.MinifyJson(await File.ReadAllTextAsync(Path.Combine(Directory.GetCurrentDirectory(), "__admin", "files", "WebApi", "booking_status_VALID_REF_response.json")));
        var query = $"/api/v1.0/booking/state?bookingReference={bookingReference}&lastName={lastName}&date={date}";

        // Act
        var response = await Client.GetAsync(query);
        var content = await response.Content.ReadAsStringAsync();

        // Assert              
        content.Should().Be(expected);
    }
}