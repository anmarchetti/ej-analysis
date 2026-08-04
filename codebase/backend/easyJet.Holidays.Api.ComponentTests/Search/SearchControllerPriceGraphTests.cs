using AutoFixture.Xunit3;
using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Controllers;
using easyJet.Holidays.Tests.Domain;
using easyJet.Holidays.Tests.Domain.ComponentTests;
using FluentAssertions;
using System.Net;
using Xunit;

namespace easyJet.Holidays.Api.ComponentTests.Search;

/// <summary>
/// Component tests for <see cref="SearchController"/>
/// </summary>
public class SearchControllerPriceGraphTests : BaseComponentTest
{

    [Trait("Api", "/api/v1.0/search/price-graph")]
    [Trait("Category", "Component")]
    [Theory]
    [InlineAutoData("Valid request", "initialDate=2020-07-03&startDate=2020-07-03&duration=7&geography=ES&accommodationIds=000000&departure=MAN&roomTypes[0]=1BA01&boardType=BB&room[0].adults=1", HttpStatusCode.OK)]
    [InlineAutoData("No startDate", "initialDate=2020-07-03&startDate=&duration=7&geography=ES&accommodationIds=000000&departure=MAN&roomTypes[0]=1BA01&boardType=BB&room[0].adults=1", HttpStatusCode.BadRequest)]
    [InlineAutoData("Duration is zero", "initialDate=2020-07-03&startDate=2020-07-03&duration=0&geography=ES&accommodationIds=000000&departure=MAN&roomTypes[0]=1BA01&boardType=BB&room[0].adults=1", HttpStatusCode.BadRequest)]
    [InlineAutoData("Duration is negative", "initialDate=2020-07-03&startDate=2020-07-03&duration=-1&geography=ES&accommodationIds=000000&departure=MAN&roomTypes[0]=1BA01&boardType=BB&room[0].adults=1", HttpStatusCode.BadRequest)]
    [InlineAutoData("No departure", "initialDate=2020-07-03&startDate=2020-07-03&duration=7&geography=ES&accommodationIds=000000&departure=&roomTypes[0]=1BA01&boardType=BB&room[0].adults=1", HttpStatusCode.BadRequest)]
    [InlineAutoData("No guests", "initialDate=2020-07-03&startDate=2020-07-03&duration=7&geography=ES&accommodationIds=000000&departure=MAN&roomTypes[0]=1BA01&boardType=BB", HttpStatusCode.BadRequest)]
    [InlineAutoData("No accommodationId", "initialDate=2020-07-03&startDate=2020-07-03&duration=7&geography=ES&accommodationIds=&departure=MAN&roomTypes[0]=1BA01&boardType=BB&room[0].adults=1", HttpStatusCode.BadRequest)]
    [InlineAutoData("Date range reached", "initialDate=2020-07-03&startDate=2020-12-03&duration=7&geography=ES&accommodationIds=&departure=MAN&roomTypes[0]=1BA01&boardType=BB&room[0].adults=1", HttpStatusCode.BadRequest)]
    [InlineAutoData("No arguments", "", HttpStatusCode.BadRequest)]
    public async Task PriceGraph_ValidateRequest(string because, string queryString, HttpStatusCode status)
    {
        // Arrange 
        var query = $"/api/v1.0/search/price-graph?{queryString}";

        // Act
        var response = await Client.GetAsync(query);

        // Assert            
        response.StatusCode.Should().Be(status, because);
    }

    [Trait("Api", "/api/v1.0/search/price-graph")]
    [Trait("Category", "Component")]
    [Theory]
    [InlineAutoData("startDate=2020-07-03&duration=7&geography=ES&accommodationId=error&departure=MAN&roomTypes[0]=1BA01&boardType=BB&room[0].adults=1")]
    public async Task PriceGraph_AtcomError_500WithErrorCode(string queryString)
    {
        await this.VerifyWhenAtcomThrowsError(
            builder => builder.WithPath("/fcgi-bin/ezydmouk/avcache3_g")
                .WithParam("s_tp", "5")
                .UsingGet(),
            $"/api/v1.0/search/alternative-flights?{queryString}",
            ApiExceptionCodes.SearchPackagesError
        );
    }

    [Trait("Api", "/api/v1.0/search/price-graph/month")]
    [Trait("Category", "Component")]
    [Theory]
    [InlineAutoData("startDate=2024-09-15&start=2024-10-01&end=2024-11-30&flexibleDays=0&duration=13&departure=LGW,LTN&room[0].adults=2&room[0].children=0&room[0].infants=0&room[0].roomCode=DBT.BL!NOR.FIT24&room[1].adults=1&room[1].children=0&room[1].infants=0&room[1].roomCode=SGL.BL!NOR.FIT24&accommodationIds=ESMJ0103&boardType=AI")]
    //__admin/files/Atcom/multiroom.xml
    //__admin/mappings/Atcom/price-graph/multi-room.json
    public async Task PriceGraphMonth_MultipleRooms_200NoResults(string queryString)
    {
        // Arrange 
        var expectedResponse = ObjectUtils.MinifyJson(await File.ReadAllTextAsync(Path.Combine(Directory.GetCurrentDirectory(), "__admin", "files", "WebApi", "price_graph_11111111.json")));
        var query = $"/api/v1.0/search/price-graph/month?{queryString}";

        // Act
        var response = await Client.GetAsync(query);
        var content = await response.Content.ReadAsStringAsync();

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        content.Should().Be(expectedResponse);
    }
}