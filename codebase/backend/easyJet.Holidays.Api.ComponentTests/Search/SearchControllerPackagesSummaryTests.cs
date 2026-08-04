using easyJet.Holidays.Tests.Domain.ComponentTests;
using FluentAssertions;
using Newtonsoft.Json.Linq;
using System.Net;
using Xunit;

namespace easyJet.Holidays.Api.ComponentTests.Search;

public class SearchControllerPackagesSummaryTests : BaseComponentTest
{
    [Theory]
    [MemberData(nameof(PackagesSummaryData))]
    public async Task PackagesSummary(string queryParams, string responseFileName)
    {
        // Arrange
        var query = $"/api/v1.0/search/packages-summary?{queryParams}";
        var expectedResponse = await File.ReadAllTextAsync(Path.Combine(Directory.GetCurrentDirectory(),
            "__admin", "files", "WebApi", "search", "packages-summary", responseFileName));

        // Act
        var response = await Client.GetAsync(query);
        var responseJson = await response.Content.ReadAsStringAsync();

        // Assert
        var expected = JToken.Parse(expectedResponse);
        var actual = JToken.Parse(responseJson);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        actual.Should().BeEquivalentTo(expected);
    }

    public static IEnumerable<object[]> PackagesSummaryData()
    {
        return new List<object[]>
        {
            new object[]
            {
                $"duration[0]=7&take=10&page=1&searchType=normal&startDate=2024-07-05&endDate=2024-07-15&flexibleDays=0&departure=LGW,LTN" +
                $"&geography=ES,ESFU&originalGeography=ES,ESFU&automaticAllocation=true&room[0].adults=2&room[0].children=0&room[0].infants=0" +
                $"&distressedFlightsOnly=false&minTemp=0&maxTemp=30",
                "packages-summary_ESFU_no_filters.json"
            },
            new object[]
            {
                $"duration[0]=7&take=10&page=1&facilities=73-363&starRating=4,5&tripAdvisorRating=4&searchType=normal" +
                $"&startDate=2024-07-05&endDate=2024-07-15&flexibleDays=0&boardType=AI%2CAI%2B%2CAS%2CTL%2CFB%2CFB-%2CFB%2B" +
                $"&departureAirport=LGW,LTN&departure=LGW,LTN&geography=ES,ESFU&originalGeography=ES,ESFU&automaticAllocation=true" +
                $"&room[0].adults=2&room[0].children=0&room[0].infants=0&PriceTo=4164&IsPricePP=false" +
                $"&distressedFlightsOnly=false&minTemp=0&maxTemp=30",
                "packages-summary_ESFU_with_filters.json"
            }
        };
    }
}
