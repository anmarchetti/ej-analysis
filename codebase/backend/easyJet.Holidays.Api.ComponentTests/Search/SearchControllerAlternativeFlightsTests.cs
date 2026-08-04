using AutoFixture.Xunit3;
using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Controllers;
using easyJet.Holidays.Tests.Domain.ComponentTests;
using FluentAssertions;
using Newtonsoft.Json.Linq;
using System.Net;
using Xunit;

namespace easyJet.Holidays.Api.ComponentTests.Search;

/// <summary>
/// Component tests for <see cref="SearchController"/>
/// </summary>
public class SearchControllerAlternativeFlightsTests : BaseComponentTest
{
    [Trait("Api", "/api/v1.0/search/alternative-flights")]
    [Trait("Category", "Component")]
    [Theory]
    [InlineAutoData("Valid request", "startDate=2020-10-03&duration=7&geography=ES&accommodationId=000000&departure=MAN&roomTypes[0]=1BA01&boardType=BB&room[0].adults=1", HttpStatusCode.OK)]
    [InlineAutoData("No startDate", "startDate=&duration=7&geography=ES&accommodationId=000000&departure=MAN&roomTypes[0]=1BA01&boardType=BB&room[0].adults=1", HttpStatusCode.BadRequest)]
    [InlineAutoData("Duration is zero", "startDate=2020-10-03&duration=0&geography=ES&accommodationId=000000&departure=MAN&roomTypes[0]=1BA01&boardType=BB&room[0].adults=1", HttpStatusCode.BadRequest)]
    [InlineAutoData("Duration is negative", "startDate=2020-10-03&duration=-1&geography=ES&accommodationId=000000&departure=MAN&roomTypes[0]=1BA01&boardType=BB&room[0].adults=1", HttpStatusCode.BadRequest)]
    [InlineAutoData("No departure", "startDate=2020-10-03&duration=7&geography=ES&accommodationId=000000&departure=&roomTypes[0]=1BA01&boardType=BB&room[0].adults=1", HttpStatusCode.BadRequest)]
    [InlineAutoData("No guests", "startDate=2020-10-03&duration=7&geography=ES&accommodationId=000000&departure=MAN&roomTypes[0]=1BA01&boardType=BB", HttpStatusCode.BadRequest)]
    [InlineAutoData("No accommodationId", "startDate=2020-10-03&duration=7&geography=ES&accommodationId=&departure=MAN&roomTypes[0]=1BA01&boardType=BB&room[0].adults=1", HttpStatusCode.BadRequest)]
    [InlineAutoData("No arguments", "", HttpStatusCode.BadRequest)]
    public async Task AlternativeFlights_ValidateRequest(string because, string queryString, HttpStatusCode status)
    {
        // Arrange 
        var query = $"/api/v1.0/search/alternative-flights?{queryString}";

        // Act
        var response = await Client.GetAsync(query);

        // Assert            
        response.StatusCode.Should().Be(status, because);
    }

    [Trait("Api", "/api/v1.0/search/alternative-flights")]
    [Trait("Category", "Component")]
    [Theory]
    [InlineAutoData("startDate=2020-10-03&duration=7&geography=ES&accommodationId=error&departure=MAN&roomTypes[0]=1BA01&boardType=BB&room[0].adults=1")]
    public async Task AlternativeFlights_AtcomError_500WithErrorCode(string queryString)
    {
        await this.VerifyWhenAtcomThrowsError(
            builder => builder.WithPath("/fcgi-bin/ezydmouk/avcache3_g")
                .WithParam("s_tp", "4")
                .UsingGet(),
            $"/api/v1.0/search/alternative-flights?{queryString}",
            ApiExceptionCodes.SearchPackagesError
        );
    }

    [Trait("Api", "/api/v1.0/search/alternative-flights")]
    [Trait("Category", "Component")]
    [Theory]
    [InlineAutoData("startDate=2020-10-03&duration=7&geography=ES&accommodationId=invalid&departure=MAN&roomTypes[0]=1BA01&boardType=BB&room[0].adults=1")]
    public async Task AlternativeFlights_Atcom200InvalidFormat_500WithErrorCode(string queryString)
    {
        await this.VerifyWhenAtcomResponseIsNotValidXml(
            builder => builder.WithPath("/fcgi-bin/ezydmouk/avcache3_g")
                .WithParam("s_tp", "4")
                .UsingGet(),
            $"/api/v1.0/search/alternative-flights?{queryString}",
            ApiExceptionCodes.SearchPackagesError,
            "invalid xml response data"
        );
    }

    [Trait("Api", "/api/v1.0/search/alternative-flights")]
    [Trait("Category", "Component")]
    [Theory]
    [InlineAutoData("startDate=2020-10-03&duration=7&geography=ES&accommodationId=000000&departure=MAN&roomTypes[0]=1BA01&boardType=BB&room[0].adults=1")]
    public async Task AlternativeFlights_Atcom200NoResults_200NoResults(string queryString)
    {
        // Arrange 
        var query = $"/api/v1.0/search/alternative-flights?{queryString}";

        // Act
        var response = await Client.GetAsync(query);
        var content = await response.Content.ReadAsStringAsync();

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        content.Should().Be(@"{""offers"":[]}");
    }

    [Trait("Api", "/api/v1.0/search/alternative-flights")]
    [Trait("Category", "Component")]
    [Theory]
    [InlineAutoData("startDate=2024-05-08&flexibleDays=0&duration=7&departure=MAN,LPL&originalAirport=LPL&room[0].adults=2&" +
                    "room[0].children=0&room[0].infants=0&room[0].roomCode=DB02&accommodationId=ESMJ0120&boardType=BB&" +
                    "outboundRouteId=E634e8425728dc2e35b553c925a12290b&inboundRouteId=Ed1d752a0dda387fdf1bf7fcc49abd9b0")]
    public async Task AlternativeFlights_WhenOffersReturnedFromAtcom_ResponseContainsAlternativeOffers(string queryString)
    {
        // Arrange 
        var expectedResponse = await File.ReadAllTextAsync(Path.Combine(
            Directory.GetCurrentDirectory(), "__admin", "files", "WebApi", "alternative_flights", "alternative_flights_for_ESMJ0120_response.json"));
        var query = $"/api/v1.0/search/alternative-flights?{queryString}";

        // Act
        var response = await Client.GetAsync(query);
        var responseJson = await response.Content.ReadAsStringAsync();

        // Assert
        var expected = JToken.Parse(expectedResponse);
        var actual = JToken.Parse(responseJson);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        actual.Should().BeEquivalentTo(expected);
    }
}