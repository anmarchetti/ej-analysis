using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.ComponentTests.Infrastructure;
using easyJet.Holidays.Api.Controllers;
using easyJet.Holidays.Tests.Domain.ComponentTests;
using System.Net;
using Xunit;

namespace easyJet.Holidays.Api.ComponentTests.Hotel;

/// <summary>
/// Component tests for <see cref="HotelController"/>
/// </summary>
public class HotelControllerReviewsTests : BaseFixtureAwareComponentTest
{
    public HotelControllerReviewsTests(WebApplicationFixture webApp) : base(webApp)
    {
    }

    [Trait("Api", "/api/v1.0/hotel/reviews")]
    [Trait("Category", "Component")]
    [Fact]
    public async Task Reviews_Valid_Response_TripAdvisor()
    {
        await Client.GetAndValidate(
            $"/api/v1.0/hotel/reviews/ID1",
            "__admin", "files", "TripAdvisor", "reviews_ID1_Api_Response.json");
    }

    [Trait("Api", "/api/v1.0/hotel/reviews")]
    [Trait("Category", "Component")]
    [Fact]
    public async Task Reviews_Failed_Response_Tripadvisor()
    {
        var message = new HttpRequestMessage(HttpMethod.Get, "/api/v1.0/hotel/reviews/ID2");

        // Act            
        var response = await Client.SendAsync(message);

        await response.AssertErrorResponse(ApiExceptionCodes.TripAdvisorLocationError, HttpStatusCode.InternalServerError);
    }
}