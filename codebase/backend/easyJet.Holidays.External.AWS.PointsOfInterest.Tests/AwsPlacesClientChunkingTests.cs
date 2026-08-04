using System;
using Xunit;
using Moq;
using Microsoft.Extensions.Options;
using PointsOfInterest.Integrations.AwsPlaces;
using PointsOfInterest.Ancillaries;
using Amazon.Extensions.NETCore.Setup;
using PointsOfInterest.Models;
using System.Collections.Generic;
using Microsoft.Extensions.Logging;

namespace easyJet.Holidays.External.AWS.PointsOfInterest.Tests;

public class AwsPlacesClientChunkingTests
{
    private AwsPlacesClient CreateClient(Mock<IHttpClientWrapper> httpMock)
    {
        var options = new AwsPlacesClientOptions
        {
            ApiKey = "key",
            BaseUrl = "https://example.com/{0}",
            Region = "eu-west-1",
            IntendedUse = "Single",
            MaxResults = 5,
            Language = new []{"en"},
            FilterCategories = new Dictionary<string,string[]>(),
            Categories = new List<CategoryThemeRadiusMapping> { new CategoryThemeRadiusMapping { Name = "Food", ThemeRadiusMappings = new(){ {"Active", 500} } } }
        };
        return new AwsPlacesClient(Options.Create(options), httpMock.Object, Options.Create(new AWSOptions()), Mock.Of<ILogger<AwsPlacesClient>>());
    }

    [Fact]
    public async System.Threading.Tasks.Task BuildRequest_ChunksIncludeAndExcludeOverLimit()
    {
        var http = new Mock<IHttpClientWrapper>();
        http.Setup(h => h.PostJson<SearchRequest, SearchResponse<SearchNearbyResponse>>(It.IsAny<string>(), It.IsAny<SearchRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new SearchResponse<SearchNearbyResponse>{ ResultItems = new List<SearchNearbyResponse>() });

        var client = CreateClient(http);
        var resort = new Resort{ ResortCode = "R", ResortName = "Resort", Hotels = new List<Hotel>(), QueryPositionLatitude = 1, QueryPositionLongitude = 2, PointsOfInterests = new(), Theme = "Active"};

        var optionsField = typeof(AwsPlacesClient).GetField("_awsPlacesClientOptions", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
        Assert.NotNull(optionsField);
        var options = (AwsPlacesClientOptions)optionsField!.GetValue(client)!;

        var include = Enumerable.Range(0, 30).Select(i => "inc_" + i).ToArray();
        var exclude = Enumerable.Range(0, 30).Select(i => "exc_" + i).ToArray();
        options.FilterCategories["FoodIncludeCategories"] = include;
        options.FilterCategories["FoodExcludeCategories"] = exclude;

        await client.SearchNearby(resort);

        http.Verify(h => h.PostJson<SearchRequest, SearchResponse<SearchNearbyResponse>>(It.IsAny<string>(), It.Is<SearchRequest>(r => r.Filter!.IncludeCategories!.Length <= 10 && r.Filter.ExcludeCategories!.Length <= 10), It.IsAny<CancellationToken>()), Times.AtLeastOnce);
    }
}
