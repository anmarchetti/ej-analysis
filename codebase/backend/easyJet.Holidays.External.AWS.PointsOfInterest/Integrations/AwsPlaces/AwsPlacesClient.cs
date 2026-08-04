using Amazon.Extensions.NETCore.Setup;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using PointsOfInterest.Ancillaries;
using PointsOfInterest.Models;
using System.Globalization;

namespace PointsOfInterest.Integrations.AwsPlaces;

internal interface IAwsPlacesClient
{
    Task SearchNearby(Resort resort);
}

internal sealed class AwsPlacesClient : IAwsPlacesClient
{
    private readonly IHttpClientWrapper _httpClientWrapper;
    private readonly AwsPlacesClientOptions _awsPlacesClientOptions;
    private readonly string _baseUrl;
    private readonly ILogger<AwsPlacesClient> _logger;
    private const int MaxCategories = 10; // AWS Places limit per Include/Exclude list
    private const double epsilon = 1e-6;
    // Fix: treat coordinates within epsilon of (0,0) as Null Island
    static bool IsNullIsland(double lat, double lon) => Math.Abs(lon) < epsilon && Math.Abs(lat) < epsilon;

    private sealed record RequestEnvelope(string Category, SearchRequest SearchRequest);
    private sealed record ResponseEvelope(Task<SearchResponse<SearchNearbyResponse>?> RequestTask, string Language, string Category);

    public AwsPlacesClient(IOptions<AwsPlacesClientOptions> options, IHttpClientWrapper httpClientWrapper, IOptions<AWSOptions> awsOptions, ILogger<AwsPlacesClient> logger)
    {
        ArgumentNullException.ThrowIfNull(options);
        ArgumentNullException.ThrowIfNull(awsOptions);
        ArgumentNullException.ThrowIfNull(httpClientWrapper);

        _awsPlacesClientOptions = options.Value;

        _httpClientWrapper = httpClientWrapper;
        _baseUrl = string.Format(CultureInfo.InvariantCulture, _awsPlacesClientOptions.BaseUrl, _awsPlacesClientOptions.Region);
        _logger = logger;
    }

    public async Task SearchNearby(Resort resort)
    {
        if (!HasValidQueryPosition([resort.QueryPositionLatitude, resort.QueryPositionLongitude]))
        {
            _logger.LogWarning("Skipping SearchNearby for resort {ResortCode} due to invalid query position latitude {QueryPositionLatitude}query position longitude {QueryPositionLongitude}", resort.ResortCode, resort.QueryPositionLatitude, resort.QueryPositionLongitude);
            return;
        }

        var responseTasks = (await FetchPois(resort)).ToList();

        // Await all tasks explicitly and keep mapping to language/category to avoid any ordering/race issues
        List<(SearchResponse<SearchNearbyResponse>? Resp, string Lang, string Cat)> materialized = await MaterializeResults(responseTasks);

        List<PointOfInterest> temp = new();
        foreach (var tuple in materialized)
        {
            var result = tuple.Resp;

            if (result == null || result.ResultItems == null) continue;

            foreach (var r in result.ResultItems)
            {
                var poi = temp.FirstOrDefault(p => p.PlaceId == r.PlaceId);
                if (poi == null)
                {
                    poi = new PointOfInterest
                    {
                        PlaceId = r.PlaceId,
                        Position = r.Position,
                        PlaceType = r.PlaceType,
                        Category = tuple.Cat,
                        PrimaryCategory = ResolvePrimaryCategory(r.Categories, tuple.Cat) ?? new Category(),
                    };
                    temp.Add(poi);
                }
                // Preserve first-seen title for a language; avoid overwriting if duplicate POI appears in another category
                if (!poi.Title.ContainsKey(tuple.Lang))
                {
                    poi.Title[tuple.Lang] = r.Title; // assign per language only once
                }
            }
        }
        resort.PointsOfInterests.AddRange(temp);
    }

    private Category? ResolvePrimaryCategory(IEnumerable<Category> categories, string categoryKey)
    {
        if (categories is null)
        {
            return null;
        }

        var categoryList = categories as IList<Category> ?? categories.ToList();
        if (_awsPlacesClientOptions.FilterCategories.TryGetValue($"{categoryKey}IncludeCategories", out var includeCategories) && includeCategories?.Length > 0)
        {
            foreach (var includeCategory in includeCategories)
            {
                var match = categoryList.FirstOrDefault(c => string.Equals(c.Id, includeCategory, StringComparison.OrdinalIgnoreCase));
                if (match != null)
                {
                    return match;
                }
            }
        }

        return categoryList.FirstOrDefault(c => c.Primary) ?? categoryList.FirstOrDefault();
    }

    private static async Task<List<(SearchResponse<SearchNearbyResponse>? Resp, string Lang, string Cat)>> MaterializeResults(List<ResponseEvelope> responseTasks)
    {
        var materialized = new List<(SearchResponse<SearchNearbyResponse>? Resp, string Lang, string Cat)>();
        foreach (var rt in responseTasks)
        {
            var resp = await rt.RequestTask; // await instead of .Result (fix CA1849 / deterministic ordering)
            materialized.Add((resp, rt.Language, rt.Category));
        }

        return materialized;
    }

    private async Task<IEnumerable<ResponseEvelope>> FetchPois(Resort resort)
    {
        var url = $"{_baseUrl}/search-nearby?key={_awsPlacesClientOptions.ApiKey}";

        var requestEnvelopes = new List<RequestEnvelope>();
        foreach (var lang in _awsPlacesClientOptions.Language)
        {
            foreach (var cat in _awsPlacesClientOptions.Categories)
            {
                requestEnvelopes.AddRange(BuildRequest(cat.Name, lang, resort));
            }
        }

        // Sequential execution to preserve deterministic ordering between language and response
        var responses = new List<ResponseEvelope>();
        foreach (var env in requestEnvelopes)
        {
            _logger.LogInformation("Fetching POIs for resort {ResortCode}, category {Category}, language {Language}, radius (M) {Radius}, query position {QueryPosition}", 
                resort.ResortCode, env.Category, env.SearchRequest.Language, env.SearchRequest.Radius, env.SearchRequest.QueryPosition);
            var resp = await _httpClientWrapper.PostJson<SearchRequest, SearchResponse<SearchNearbyResponse>>(url, env.SearchRequest);
            responses.Add(new ResponseEvelope(Task.FromResult(resp), env.SearchRequest.Language!, env.Category));
        }

        return responses;
    }

    static IEnumerable<string[]> Chunk(string[] src) => src.Chunk(MaxCategories).Select(x => x.ToArray());

    private IEnumerable<RequestEnvelope> BuildRequest(string categoryKey, string language, Resort resort)
    {
        var results = new List<RequestEnvelope>();

        _awsPlacesClientOptions.FilterCategories.TryGetValue($"{categoryKey}IncludeCategories", out var includeCategories);
        _awsPlacesClientOptions.FilterCategories.TryGetValue($"{categoryKey}ExcludeCategories", out var excludeCategories);

        includeCategories ??= [];
        excludeCategories ??= [];

        RequestEnvelope Create(string[] includeCategories, string[] excludeCategories) => new(categoryKey, new SearchRequest
        {
            QueryPosition = [resort.QueryPositionLongitude, resort.QueryPositionLatitude],
            Filter = new()
            {
                IncludeCategories = includeCategories,
                ExcludeCategories = excludeCategories
            },
            Radius = resort.Radiuskm * 1000,
            Language = language,
            MaxResults = _awsPlacesClientOptions.MaxResults,
            IntendedUse = _awsPlacesClientOptions.IntendedUse
        });

        if (includeCategories.Length <= MaxCategories && excludeCategories.Length <= MaxCategories)
        {
            results.Add(Create(includeCategories, excludeCategories));
            return results;
        }

        var includeChunks = includeCategories.Length > MaxCategories ? Chunk(includeCategories).ToList() : new List<string[]> { includeCategories };
        var excludeChunks = excludeCategories.Length > MaxCategories ? Chunk(excludeCategories).ToList() : new List<string[]> { excludeCategories };

        if (includeCategories.Length > MaxCategories && excludeCategories.Length <= MaxCategories)
        {
            foreach (var inc in includeChunks)
                results.Add(Create(inc, excludeCategories));
            return results;
        }

        if (excludeCategories.Length > MaxCategories && includeCategories.Length <= MaxCategories)
        {
            foreach (var exc in excludeChunks)
                results.Add(Create(includeCategories, exc));
            return results;
        }

        foreach (var inc in includeChunks)
            foreach (var exc in excludeChunks)
                results.Add(Create(inc, exc));

        return results;
    }

    private static bool HasValidQueryPosition(IList<double> queryPosition)
    {
        return queryPosition.Count == 2 && !IsNullIsland(queryPosition[0], queryPosition[1]);
    }
}
