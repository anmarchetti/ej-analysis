using easyJet.Holidays.Api.ComponentTests.Infrastructure;
using easyJet.Holidays.Tests.Domain.ComponentTests;
using FluentAssertions;
using Newtonsoft.Json.Linq;
using System.Net;
using Xunit;

namespace easyJet.Holidays.Api.ComponentTests.Search;

public class SearchControllerPackagesMapTests : BaseFixtureAwareComponentTest
{
    public SearchControllerPackagesMapTests(WebApplicationFixture webApp) : base(webApp)
    {
    }

    [Theory]
    [MemberData(nameof(PackagesMapData))]
    public async Task PackagesMap(string queryParams, string responseFileName)
    {
        // Arrange
        var query = $"/api/v1.0/search/packages-map?{queryParams}";
        var expectedResponse = await File.ReadAllTextAsync(Path.Combine(Directory.GetCurrentDirectory(),
            "__admin", "files", "WebApi", "search", "packages-map", responseFileName));

        // Act
        var response = await Client.GetAsync(query);
        var responseJson = await response.Content.ReadAsStringAsync();

        // Assert
        var expected = JToken.Parse(expectedResponse);
        var actual = JToken.Parse(responseJson);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        actual.Should().BeEquivalentTo(expected);
    }

    public static IEnumerable<object[]> PackagesMapData()
    {
        return new List<object[]>
        {
            new object[]
            {
                $"startDate=2024-07-05&flexibleDays=0&duration=7&departure=LGW,LTN&geography=ES,ESFU&room[0].adults=2" +
                $"&room[0].children=0&room[0].infants=0&departureAirport=LGW,LTN" +
                $"&polygon=28.553716488166078,-13.587422027139416|28.553716488166078,-14.451222075967541" +
                $"|28.251721421029597,-14.451222075967541|28.251721421029597,-13.587422027139416",
                "packages-map_ESFU.json"
            }
        };
    }
}
