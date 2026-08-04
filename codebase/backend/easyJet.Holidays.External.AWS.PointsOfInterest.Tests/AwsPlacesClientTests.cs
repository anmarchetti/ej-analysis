using Moq;
using Microsoft.Extensions.Options;
using PointsOfInterest.Integrations.AwsPlaces;
using PointsOfInterest.Ancillaries;
using Amazon.Extensions.NETCore.Setup;
using PointsOfInterest.Models;
using Microsoft.Extensions.Logging;

namespace easyJet.Holidays.External.AWS.PointsOfInterest.Tests;

public class AwsPlacesClientTests
{
    private AwsPlacesClient CreateClient(Mock<IHttpClientWrapper> httpMock, AwsPlacesClientOptions? options = null)
    {
        options ??= new AwsPlacesClientOptions
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

    private static List<Category> PrimaryCat() => new(){ new Category{ Id = "c1", Name = "C1", LocalizedName = "C1", Primary = true } };

    [Fact]
    public async System.Threading.Tasks.Task SearchNearby_AggregatesAndAddsUniquePois()
    {
        var http = new Mock<IHttpClientWrapper>();
        var responses = new List<SearchResponse<SearchNearbyResponse>>
        {
            new(){ ResultItems = new(){ new SearchNearbyResponse{ PlaceId = "A", PlaceType = "Type", Title = "Title EN", Position = new List<double>{1,2}, Categories = PrimaryCat() } } },
            new(){ ResultItems = new(){ new SearchNearbyResponse{ PlaceId = "A", PlaceType = "Type", Title = "Titel DE", Position = new List<double>{1,2}, Categories = PrimaryCat() } } }
        };
        int call = 0;
        http.Setup(h => h.PostJson<SearchRequest, SearchResponse<SearchNearbyResponse>>(It.IsAny<string>(), It.IsAny<SearchRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(() => responses[Math.Min(call++, responses.Count-1)]);

        var options = new AwsPlacesClientOptions
        {
            ApiKey = "key",
            BaseUrl = "https://example.com/{0}",
            Region = "eu-west-1",
            IntendedUse = "Single",
            MaxResults = 5,
            Language = new []{"en","de"},
            FilterCategories = new Dictionary<string,string[]>(),
            Categories = new List<CategoryThemeRadiusMapping> { new CategoryThemeRadiusMapping { Name = "Food", ThemeRadiusMappings = new() { { "Active", 500 } } } }
        };
        var client = CreateClient(http, options);
        var resort = new Resort{ ResortCode = "R", ResortName = "Resort", Hotels = new List<Hotel>(), QueryPositionLatitude = 1, QueryPositionLongitude = 2, PointsOfInterests = new(), Theme = "Active"};

        await client.SearchNearby(resort);

        Assert.Single(resort.PointsOfInterests); // one POI aggregated
        var poi = resort.PointsOfInterests.First();
        Assert.Equal("A", poi.PlaceId);
        Assert.Equal("Title EN", poi.Title["en"]);
        Assert.Equal("Titel DE", poi.Title["de"]);
    }

    [Fact]
    public async System.Threading.Tasks.Task SearchNearby_UsesIncludeCategoriesOrderForPrimaryCategory()
    {
        var http = new Mock<IHttpClientWrapper>();
        http.Setup(h => h.PostJson<SearchRequest, SearchResponse<SearchNearbyResponse>>(It.IsAny<string>(), It.IsAny<SearchRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new SearchResponse<SearchNearbyResponse>
            {
                ResultItems = new()
                {
                    new SearchNearbyResponse
                    {
                        PlaceId = "POI1",
                        PlaceType = "Type",
                        Title = "Title EN",
                        Position = new List<double>{1,2},
                        Categories = new List<Category>
                        {
                            new Category{ Id = "gift,_antique_and_art", Name = "Gift", LocalizedName = "Gift", Primary = true },
                            new Category{ Id = "landmark-attraction", Name = "Landmark", LocalizedName = "Landmark", Primary = false }
                        }
                    }
                }
            });

        var options = new AwsPlacesClientOptions
        {
            ApiKey = "key",
            BaseUrl = "https://example.com/{0}",
            Region = "eu-west-1",
            IntendedUse = "Single",
            MaxResults = 5,
            Language = new []{"en"},
            FilterCategories = new Dictionary<string,string[]>
            {
                { "FoodIncludeCategories", new []{ "landmark-attraction", "gift,_antique_and_art" } }
            },
            Categories = new List<CategoryThemeRadiusMapping>
            {
                new CategoryThemeRadiusMapping { Name = "Food", ThemeRadiusMappings = new() { { "Active", 500 } } }
            }
        };

        var client = CreateClient(http, options);
        var resort = new Resort{ ResortCode = "R", ResortName = "Resort", Hotels = new List<Hotel>(), QueryPositionLatitude = 1, QueryPositionLongitude = 2, PointsOfInterests = new(), Theme = "Active"};

        await client.SearchNearby(resort);

        var poi = Assert.Single(resort.PointsOfInterests);
        Assert.Equal("landmark-attraction", poi.PrimaryCategory.Id);
    }

    [Fact]
    public async System.Threading.Tasks.Task SearchNearby_NullResultItem_SkipsAndDoesNotThrow()
    {
        var http = new Mock<IHttpClientWrapper>();
        http.Setup(h => h.PostJson<SearchRequest, SearchResponse<SearchNearbyResponse>>(It.IsAny<string>(), It.IsAny<SearchRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((SearchResponse<SearchNearbyResponse>?)null);
        var options = new AwsPlacesClientOptions
        {
            ApiKey = "key",
            BaseUrl = "https://example.com/{0}",
            Region = "eu-west-1",
            IntendedUse = "Single",
            MaxResults = 5,
            Language = new []{"en"},
            FilterCategories = new Dictionary<string,string[]>(),
            Categories = new List<CategoryThemeRadiusMapping> { new CategoryThemeRadiusMapping { Name = "Food", ThemeRadiusMappings = new() { { "Active", 500 } } } }
        };
        var client = CreateClient(http, options);
        var resort = new Resort{ ResortCode = "R", ResortName = "Resort", Hotels = new List<Hotel>(), QueryPositionLatitude = 1, QueryPositionLongitude = 2, PointsOfInterests = new(), Theme = "Active"};
        await client.SearchNearby(resort); // should not throw
        Assert.Empty(resort.PointsOfInterests);
    }

    [Fact]
    public async System.Threading.Tasks.Task SearchNearby_SkipsInvalidQueryPosition()
    {
        var http = new Mock<IHttpClientWrapper>();
        var client = CreateClient(http);
        var resort = new Resort{ ResortCode = "R", ResortName = "Resort", Hotels = new List<Hotel>(), QueryPositionLatitude = 0.0, QueryPositionLongitude = 0.0, PointsOfInterests = new(), Theme = "Active"};

        await client.SearchNearby(resort);

        Assert.Empty(resort.PointsOfInterests);
        http.Verify(h => h.PostJson<SearchRequest, SearchResponse<SearchNearbyResponse>>(It.IsAny<string>(), It.IsAny<SearchRequest>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async System.Threading.Tasks.Task SearchNearby_WhenCategoriesNull_AssignsDefaultPrimaryCategory()
    {
        var http = new Mock<IHttpClientWrapper>();
        http.Setup(h => h.PostJson<SearchRequest, SearchResponse<SearchNearbyResponse>>(It.IsAny<string>(), It.IsAny<SearchRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new SearchResponse<SearchNearbyResponse>
            {
                ResultItems = new List<SearchNearbyResponse>
                {
                    new()
                    {
                        PlaceId = "A",
                        PlaceType = "Type",
                        Title = "Title EN",
                        Position = new List<double> { 1, 2 },
                        Categories = null!
                    }
                }
            });

        var options = new AwsPlacesClientOptions
        {
            ApiKey = "key",
            BaseUrl = "https://example.com/{0}",
            Region = "eu-west-1",
            IntendedUse = "Single",
            MaxResults = 5,
            Language = new[] { "en" },
            FilterCategories = new Dictionary<string, string[]>(),
            Categories = new List<CategoryThemeRadiusMapping>
            {
                new() { Name = "Food", ThemeRadiusMappings = new() { { "Active", 500 } } }
            }
        };

        var client = CreateClient(http, options);
        var resort = new Resort
        {
            ResortCode = "R",
            ResortName = "Resort",
            Hotels = new List<Hotel>(),
            QueryPositionLatitude = 1,
            QueryPositionLongitude = 2,
            PointsOfInterests = new(),
            Theme = "Active"
        };

        await client.SearchNearby(resort);

        var poi = Assert.Single(resort.PointsOfInterests);
        Assert.Equal("Food", poi.Category);
        Assert.Equal(string.Empty, poi.PrimaryCategory.Name); // default category assigned
    }
}
