using AutoFixture.Xunit3;
using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.ComponentTests.Infrastructure;
using easyJet.Holidays.Api.Controllers.Booking;
using easyJet.Holidays.Tests.Domain.ComponentTests;
using FluentAssertions;
using Microsoft.Net.Http.Headers;
using Newtonsoft.Json;
using System.Net;
using System.Text;
using Xunit;

namespace easyJet.Holidays.Api.ComponentTests.Booking;

/// <summary>
/// Component tests for <see cref="BookingController"/>
/// </summary>
public class BookingControllerAssignTests : BaseFixtureAwareComponentTest
{
    public BookingControllerAssignTests(WebApplicationFixture webApp) : base(webApp)
    {
    }

    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/booking")]
    [Fact]
    public async Task Assign_Unauthorized_Error()
    {
        // Arrange 
        var query = $"/api/v1.0/booking/assign";
        var body = JsonConvert.SerializeObject(new
        {
            bookingReference = "test",
            lastName = "test",
            date = "2020-01-01"
        });

        // Act
        var response = await Client.PostAsync(query, new StringContent(body, Encoding.UTF8, "application/json"));

        // Assert  
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/booking")]
    [Theory]
    [InlineAutoData("/api/v1.0/booking/assign", "eJ2Session=495d1c49420a43a8122d6b2f5ff1a48e162a8bd69ecd779b866bdc09574776ae&CookieTypeKey=1;", "VALID_WITH_CUSID", "Johnson", "2020-01-01")]
    public async Task Assign_LogedIn_WithCusId_ErrorAlreadyAssignedToCustomer(string apiUrl, string cookie, string bookingReference, string lastName, string date)
    {
        // Arrange 
        var body = JsonConvert.SerializeObject(new
        {
            bookingReference,
            lastName,
            date
        });

        var message = new HttpRequestMessage(HttpMethod.Post, apiUrl);
        message.Headers.Add(HeaderNames.Cookie, cookie);
        message.Content = new StringContent(body, Encoding.UTF8, "application/json");

        // Act            
        var response = await Client.SendAsync(message);

        // Assert  
        await response.AssertErrorResponse(ApiExceptionCodes.BookingAssignAlreadyAssignedToAccount, HttpStatusCode.BadRequest, "already assigned");
    }

    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/booking")]
    [Theory]
    [InlineAutoData("/api/v1.0/booking/assign", "eJ2Session=495d1c49420a43a8122d6b2f5ff1a48e162a8bd69ecd779b866bdc09574776ae&CookieTypeKey=1;", "VALID_WITH_CUSID_1", "Johnson", "2020-01-01")]
    public async Task Assign_LogedIn_WithDifferentCusId_ErrorAlreadyAssigned(string apiUrl, string cookie, string bookingReference, string lastName, string date)
    {
        // Arrange 
        var body = JsonConvert.SerializeObject(new
        {
            bookingReference,
            lastName,
            date
        });

        var message = new HttpRequestMessage(HttpMethod.Post, apiUrl);
        message.Headers.Add(HeaderNames.Cookie, cookie);
        message.Content = new StringContent(body, Encoding.UTF8, "application/json");

        // Act            
        var response = await Client.SendAsync(message);

        // Assert  
        await response.AssertErrorResponse(ApiExceptionCodes.BookingAssignAlreadyAssigned, HttpStatusCode.BadRequest, "already assigned");
    }

    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/booking")]
    [Theory]
    [InlineAutoData("/api/v1.0/booking/assign", "eJ2Session=495d1c49420a43a8122d6b2f5ff1a48e162a8bd69ecd779b866bdc09574776ae&CookieTypeKey=1;", "VALID_NO_CUSID_other@ej", "Johnson", "2020-01-01")]
    public async Task Assign_LogedIn_NoCusIdWithEmailDifferentFromCustomer_Error(string apiUrl, string cookie, string bookingReference, string lastName, string date)
    {
        // Arrange 
        var body = JsonConvert.SerializeObject(new
        {
            bookingReference,
            lastName,
            date
        });

        var message = new HttpRequestMessage(HttpMethod.Post, apiUrl);
        message.Headers.Add(HeaderNames.Cookie, cookie);
        message.Content = new StringContent(body, Encoding.UTF8, "application/json");

        // Act            
        var response = await Client.SendAsync(message);

        // Assert  
        await response.AssertErrorResponse(ApiExceptionCodes.BookingAssignInvalidEmail, HttpStatusCode.BadRequest, "already assigned");
    }

    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/booking")]
    [Theory]
    [InlineAutoData("/api/v1.0/booking/assign", "eJ2Session=495d1c49420a43a8122d6b2f5ff1a48e162a8bd69ecd779b866bdc09574776ae&CookieTypeKey=1;", "VALID_NO_CUSID", "Johnson", "2020-01-01")]
    public async Task Assign_LogedIn_NoCusId_Ok(string apiUrl, string cookie, string bookingReference, string lastName, string date)
    {
        // Arrange 
        var body = JsonConvert.SerializeObject(new
        {
            bookingReference,
            lastName,
            date
        });

        var message = new HttpRequestMessage(HttpMethod.Post, apiUrl);
        message.Headers.Add(HeaderNames.Cookie, cookie);
        message.Content = new StringContent(body, Encoding.UTF8, "application/json");

        // Act            
        var response = await Client.SendAsync(message);

        // Assert  
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}