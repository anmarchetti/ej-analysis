using easyJet.Holidays.Api.ComponentTests.Infrastructure;
using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.Dates;
using easyJet.Holidays.Tests.Domain.ComponentTests;
using easyJet.Holidays.Tests.Domain.Integration;
using FluentAssertions;
using FluentAssertions.Execution;
using Microsoft.Net.Http.Headers;
using Newtonsoft.Json;
using System.Net;
using System.Net.Http.Json;
using Xunit;

namespace easyJet.Holidays.Api.ComponentTests.AmendBooking;

public class AmendBookingControllerAlternativeFlightsTests : BaseFixtureAwareComponentTest
{
    private const string SessionCookie = "eJ2Session=495d1c49420a43a8122d6b2f5ff1a48e3a6aca8c7b03b9615e9c9ba0410e9c9085e321e4cb2f7a489795c200eb5760cf&CookieTypeKey=1; expires=Thu, 23 Aug 3029 12:21:26 GMT; domain=; path=/; secure; samesite=lax; httponly";
    private const string SessionCookieValidate = "eJ2Session=495d1c49420a43a8122d6b2f5ff1a48e162a8bd69ecd779b866bdc09574776ae&CookieTypeKey=1;";

    public AmendBookingControllerAlternativeFlightsTests(WebApplicationFixture webApp) : base(webApp)
    {
    }

    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/amend/alternative-flights")]
    [Theory]
    [InlineData("Valid bookingRef", "bookingReference=70143315", HttpStatusCode.OK)]
    public async Task AlternativeFlights_ValidateRequest(string because, string queryString, HttpStatusCode status)
    {
        // Arrange 
        var query = $"/api/v1.0/amend/alternative-flights?{queryString}";
        var expectedResponse = ComponentTestUtils.GetJsonString(@"\WebApi\alternative_flights\alternative_flights_bookingReference_70143315.json", minify: true);

        var message = new HttpRequestMessage(HttpMethod.Get, query);
        message.Headers.Add(HeaderNames.Cookie, SessionCookie);
        message.Headers.Add(HeaderNames.Cookie, $"ejHolidaysUserId=someid; expires=Thu, 23 Aug 3029 12:21:26 GMT; domain=; path=/; secure; samesite=lax;");
        message.Headers.Add(HeaderNames.Cookie, $"ejHolidaysSessionId=sessionid; expires=Mon, 26 Aug 2019 12:41:26 GMT; domain=localhost; path=/; secure; samesite=lax; httponly");

        // Act
        var response = await Client.SendAsync(message);
        var responseJson = await response.Content.ReadAsStringAsync();

        // Assert            
        responseJson.Should().Be(expectedResponse);
    }

    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/amend/alternative-flights")]
    [Theory]
    [InlineData("bookingReference=", HttpStatusCode.BadRequest)]
    public async Task AlternativeFlights_InvalidBookingReference(string queryString, HttpStatusCode status)
    {
        // Arrange 
        var query = $"/api/v1.0/amend/alternative-flights?{queryString}";

        var message = new HttpRequestMessage(HttpMethod.Get, query);
        message.Headers.Add(HeaderNames.Cookie, SessionCookie);
        message.Headers.Add(HeaderNames.Cookie, $"ejHolidaysUserId=someid; expires=Thu, 23 Aug 3029 12:21:26 GMT; domain=; path=/; secure; samesite=lax;");
        message.Headers.Add(HeaderNames.Cookie, $"ejHolidaysSessionId=sessionid; expires=Mon, 26 Aug 2019 12:41:26 GMT; domain=localhost; path=/; secure; samesite=lax; httponly");

        // Act
        var response = await Client.SendAsync(message);

        // Assert            
        response.StatusCode.Should().Be(status);
    }

    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/amend/alternative-flights/validate")]
    [Theory]
    [InlineData(HttpStatusCode.OK)]
    public async Task AlternativeFlightsvalidate_ValidBookingReference_No_Promocode(HttpStatusCode status)
    {
        var bodyJson = await File.ReadAllTextAsync(Path.Combine(Directory.GetCurrentDirectory(), "__admin", "files", "WebApi", "alternative_flights", "flight_validate_request_body_no_promo.json"));
        var expectedResponse = ComponentTestUtils.GetJsonString(@"\WebApi\alternative_flights\flight_validate_response_body_no_promo.json", minify: true);

        var body = JsonConvert.DeserializeObject<AlternativeFlightFullPriceRequest>(bodyJson);

        // Arrange 
        var query = $"/api/v1.0/amend/alternative-flights/validate";

        var message = new HttpRequestMessage(HttpMethod.Post, query);
        message.Headers.Add(HeaderNames.Cookie, SessionCookieValidate);
        message.Content = JsonContent.Create(body);

        // Act
        var response = await Client.SendAsync(message);
        var responseJson = await response.Content.ReadAsStringAsync();

        // Assert            
        using (new AssertionScope())
        {
            response.StatusCode.Should().Be(status);
            responseJson.Should().Be(expectedResponse);
        }
    }

    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/amend/alternative-flights/validate")]
    [Theory]
    [InlineData(HttpStatusCode.OK)]
    public async Task AlternativeFlightsvalidate_ValidBookingReference_With_Promocode_No_Change_In_Promocode(HttpStatusCode status)
    {
        var bodyJson = await File.ReadAllTextAsync(Path.Combine(Directory.GetCurrentDirectory(), "__admin", "files", "WebApi", "alternative_flights", "flight_validate_request_body_promo.json"));
        var expectedResponse = ComponentTestUtils.GetJsonString(@"\WebApi\alternative_flights\flight_validate_response_body_promo.json", minify: true);

        var body = JsonConvert.DeserializeObject<AlternativeFlightFullPriceRequest>(bodyJson);

        // Arrange 
        var query = $"/api/v1.0/amend/alternative-flights/validate";

        var message = new HttpRequestMessage(HttpMethod.Post, query);
        message.Headers.Add(HeaderNames.Cookie, SessionCookieValidate);
        message.Content = JsonContent.Create(body);

        // Act
        var response = await Client.SendAsync(message);
        var responseJson = await response.Content.ReadAsStringAsync();

        // Assert            
        using (new AssertionScope())
        {
            response.StatusCode.Should().Be(status);
            responseJson.Should().Be(expectedResponse);
        }
    }

    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/amend/alternative-flights/validate")]
    [Fact]
    public async Task AlternativeFlightsValidate_AtcomErrorOnValidate_Pipeline()
    {
        var bodyJson = await File.ReadAllTextAsync(Path.Combine(Directory.GetCurrentDirectory(), "__admin", "files", "WebApi", "alternative_flights", "flight_validate_request_body_promo.json"));

        var body = JsonConvert.DeserializeObject<AlternativeFlightFullPriceRequest>(bodyJson);

        body!.BookingReference = "AMEND_BOOKING_ATCOM_VRP_ERROR";

        const string query = $"/api/v1.0/amend/alternative-flights/validate";

        var message = new HttpRequestMessage(HttpMethod.Post, query);
        message.Headers.Add(HeaderNames.Cookie, SessionCookieValidate);
        message.Content = JsonContent.Create(body);

        var response = await Client.SendAsync(message);
        var responseString = await response.Content.ReadAsStringAsync();

        var result = JsonConvert.DeserializeObject<AmendDateInfoResponse>(responseString);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        result.Should().BeEquivalentTo(new AmendDateInfoResponse());
    }
}