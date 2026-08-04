using AutoFixture.Xunit3;
using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.ComponentTests.Infrastructure;
using easyJet.Holidays.Api.Controllers.Booking;
using easyJet.Holidays.Tests.Domain.ComponentTests;
using FluentAssertions;
using System.Net;
using Xunit;

namespace easyJet.Holidays.Api.ComponentTests.Booking;

/// <summary>
/// Component tests for <see cref="BookingController"/>
/// </summary>
public class BookingControllerConfirmationTests : BaseFixtureAwareComponentTest
{
    public BookingControllerConfirmationTests(WebApplicationFixture webApp) : base(webApp)
    {
    }

    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/booking/confirmation")]
    [Theory]
    [InlineAutoData("Valid data", "VALID_REF", "Johnson", "2020-01-01", HttpStatusCode.OK)]
    [InlineAutoData("Invalid booking reference", "", "LastName", "2020-01-01", HttpStatusCode.BadRequest)]
    [InlineAutoData("Invalid last name", "VALID_REF", "", "2020-01-01", HttpStatusCode.BadRequest)]
    [InlineAutoData("No date", "VALID_REF", "LastName", "", HttpStatusCode.BadRequest)]
    [InlineAutoData("Invalid date", "VALID_REF", "LastName", "date2020-01-01", HttpStatusCode.BadRequest)]
    public async Task Confirmation_Validate_RequestArguments(string because, string bookingReference, string lastName, string date, HttpStatusCode status)
    {
        // Arrange 
        var query = $"/api/v1.0/booking/confirmation?bookingReference={bookingReference}&lastName={lastName}&date={date}";

        // Act
        var response = await Client.GetAsync(query);

        // Assert            
        response.StatusCode.Should().Be(status, because);
    }

    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/booking/confirmation")]
    [Theory]
    [InlineAutoData("Invalid reference", "INVALID_REF", "Johnson", "2020-01-01", HttpStatusCode.BadRequest)]
    [InlineAutoData("Invalid last name", "VALID_REF", "JJohnson", "2020-01-01", HttpStatusCode.BadRequest)]
    [InlineAutoData("Invalid date", "VALID_REF", "Johnson", "3020-01-01", HttpStatusCode.BadRequest)]
    public async Task Confirmation_InvalidData_ThrowError(string because, string bookingReference, string lastName, string date, HttpStatusCode status)
    {
        // Arrange 
        var query = $"/api/v1.0/booking/confirmation?bookingReference={bookingReference}&lastName={lastName}&date={date}";

        // Act
        var response = await Client.GetAsync(query);

        // Assert            
        await response.AssertErrorResponse(ApiExceptionCodes.DfloGetDocumentsError, status, because);
    }

    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/booking/confirmation")]
    [Theory]
    [InlineAutoData("VALID_REF", "Johnson", "2020-01-01")]
    public async Task Confirmation_TwoAmendments_ReturnLast(string bookingReference, string lastName, string date)
    {
        // Arrange 
        var expected = await File.ReadAllTextAsync(Path.Combine(Directory.GetCurrentDirectory(), "__admin", "files", "dFlo", "confirmation.response"));
        var query = $"/api/v1.0/booking/confirmation?bookingReference={bookingReference}&lastName={lastName}&date={date}";

        // Act
        var response = await Client.GetAsync(query);
        var content = await response.Content.ReadAsStringAsync();


        // Assert
        response.Content.Headers.ContentType?.ToString().Should().Be("application/pdf");
        content.Should().Be(expected);
    }
}