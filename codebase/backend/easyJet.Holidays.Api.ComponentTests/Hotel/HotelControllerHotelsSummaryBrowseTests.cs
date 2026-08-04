using easyJet.Holidays.Api.ComponentTests.Infrastructure;
using easyJet.Holidays.Api.Controllers;
using easyJet.Holidays.Tests.Domain.ComponentTests;
using FluentAssertions;
using Newtonsoft.Json;
using System.Net;
using System.Text;
using Xunit;

namespace easyJet.Holidays.Api.ComponentTests.Hotel;

/// <summary>
/// Component tests for <see cref="HotelController"/>
/// </summary>
public class HotelControllerHotelsSummaryBrowseTests : BaseFixtureAwareComponentTest
{
    public HotelControllerHotelsSummaryBrowseTests(WebApplicationFixture webApp) : base(webApp)
    {
    }

    public static IEnumerable<object[]> ValidateTestData()
    {
        yield return new object[] {
            "The same latitude",
            new {
                topLeftAngle = new
                {
                    latitude = 90,
                    longitude = -90,
                },
                bottomRightAngle = new
                {
                    latitude = 90,
                    longitude = -91,
                }
            },
            HttpStatusCode.InternalServerError
        };
        yield return new object[] {
            "The same longitude",
            new {
                topLeftAngle = new
                {
                    latitude = 90,
                    longitude = -91,
                },
                bottomRightAngle = new
                {
                    latitude = 91,
                    longitude = -91,
                }
            },
            HttpStatusCode.InternalServerError
        };
    }

    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/hotel/summary/polygon")]
    [Theory]
    [MemberData(nameof(ValidateTestData))]
    public async Task PolygonSearch_ValidateRequest(string because, object requestBody, HttpStatusCode status)
    {
        // Arrange 
        var query = $"/api/v1.0/hotel/summary/polygon";
        var body = JsonConvert.SerializeObject(requestBody);

        // Act
        var response = await Client.PostAsync(query, new StringContent(body, Encoding.UTF8, "application/json"));

        // Assert            
        response.StatusCode.Should().Be(status, because);
    }

    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/hotel/summary/polygon")]
    [Fact]
    public async Task PolygonSearch_Successs_ShouldReturnHotels()
    {
        // Arrange 
        var requestBody = new
        {
            topLeftAngle = new
            {
                latitude = 90,
                longitude = -180,
            },
            bottomRightAngle = new
            {
                latitude = -90,
                longitude = 180,
            }
        };
        var body = JsonConvert.SerializeObject(requestBody);

        await Client.PostAndValidate(
            $"/api/v1.0/hotel/summary/polygon",
            body,
            "__admin", "files", "WebApi", "hotel-offers", "polygon_search_90_-180_-90_180.json");
    }
}