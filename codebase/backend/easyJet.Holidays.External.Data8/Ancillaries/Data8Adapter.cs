using easyJet.Holidays.Api.Domain.Services.Language;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Data8.Models;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.Data8.Ancillaries;

/// <summary>
/// Adapter for Data8 address search and retrieval endpoints.
/// </summary>
public interface IData8Adapter
{
    /// <summary>
    /// Searches for matching address suggestions.
    /// </summary>
    /// <param name="addressToFind">Address text entered by the user.</param>
    /// <param name="countryCode"></param>
    /// <param name="cancellationToken">Request cancellation token.</param>
    /// <returns>Matching address suggestions.</returns>
    Task<SearchAddressResponse> LookupAddress(string addressToFind, string countryCode, CancellationToken cancellationToken = default);

    /// <summary>
    /// Retrieves full address details by Data8 value identifier.
    /// </summary>
    /// <param name="value">Data8 value identifier.</param>
    /// <param name="countryCode"></param>
    /// <param name="cancellationToken">Request cancellation token.</param>
    /// <returns>Resolved address details.</returns>
    Task<AddressResult> RetrieveAddress(string value, string countryCode, CancellationToken cancellationToken = default);
}

/// <summary>
/// Data8 implementation for address search, drilldown and retrieval.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="Data8Adapter"/> class.
/// </remarks>
/// <param name="data8HttpClient">Data8 HTTP client abstraction.</param>
/// <param name="languageService">Language service for request localization values.</param>
/// <param name="data8Settings">Data8 configuration options.</param>
public class Data8Adapter(IData8HttpClient data8HttpClient, ILanguageService languageService, IOptions<Data8Settings> data8Settings) : IData8Adapter
{
    private const string SearchEndpoint = "PredictiveAddress/Search.json";
    private const string DrillDownEndpoint = "PredictiveAddress/DrillDown.json";
    private const string RetrieveEndpoint = "PredictiveAddress/Retrieve.json";

    private readonly IData8HttpClient _data8HttpClient = data8HttpClient;
    private readonly ILanguageService _languageService = languageService;
    private readonly int _numberOfResults = data8Settings.Value.NumberOfResults > 0
        ? data8Settings.Value.NumberOfResults
        : int.MaxValue;

    /// <inheritdoc />
    public async Task<SearchAddressResponse> LookupAddress(string addressToFind, string countryCode, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(addressToFind) || string.IsNullOrWhiteSpace(countryCode))
        {
            return new SearchAddressResponse();
        }

        var currentLanguage = _languageService.GetCurrentLanguage();
        var searchRequest = new
        {
            country = countryCode,
            search = addressToFind,
            options = new
            {
                PreferredLanguage = currentLanguage
            }
        };

        var searchResponse = await _data8HttpClient.Post<SearchDrillDownResponse>(SearchEndpoint, searchRequest, cancellationToken);
        var searchResults = (searchResponse?.Results ?? [])
            .Where(result => !string.IsNullOrWhiteSpace(result.Value))
            .ToList();

        if (searchResults.Count == 0)
        {
            return new SearchAddressResponse();
        }

        var resolvedResults = await ResolveDrillDownResults(searchResults, countryCode, currentLanguage, searchResponse?.SessionId ?? string.Empty, cancellationToken);
        var addresses = resolvedResults
            .GroupBy(result => result.Value, StringComparer.OrdinalIgnoreCase)
            .Select(group => group.First())
            .Take(_numberOfResults)
            .Select(result => new SearchAddressItem
            {
                Id = result.Value,
                AddressLine = result.Label
            })
            .ToList();

        return new SearchAddressResponse { Items = new (addresses) };
    }

    private async Task<List<SearchResult>> ResolveDrillDownResults(
        IReadOnlyCollection<SearchResult> searchResults,
        string currentCountry,
        string currentLanguage,
        string sessionId,
        CancellationToken cancellationToken)
    {
        var resolvedResults = searchResults.Where(x => !x.Container).ToList();
        var containersToResolve = new Queue<SearchResult>(searchResults.Where(x => x.Container));

        while (containersToResolve.Count > 0)
        {
            cancellationToken.ThrowIfCancellationRequested();

            var container = containersToResolve.Dequeue();
            var drillDownRequest = new
            {
                country = currentCountry,
                id = container.Value,
                options = new
                {
                    PreferredLanguage = currentLanguage
                },
                SessionID = sessionId
            };

            var drillDownResponse = await _data8HttpClient.Post<SearchDrillDownResponse>(DrillDownEndpoint, drillDownRequest, cancellationToken);
            var drillDownResults = (drillDownResponse?.Results ?? [])
                .Where(result => !string.IsNullOrWhiteSpace(result.Value));

            foreach (var result in drillDownResults)
            {
                if (result.Container)
                {
                    containersToResolve.Enqueue(result);
                    continue;
                }

                resolvedResults.Add(result);
            }
        }

        return resolvedResults;
    }

    /// <inheritdoc />
    public async Task<AddressResult> RetrieveAddress(string value, string countryCode, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(value) || string.IsNullOrWhiteSpace(countryCode))
        {
            return new AddressResult();
        }

        var currentLanguage = _languageService.GetCurrentLanguage();
        var retrieveRequest = new
        {
            country = countryCode,
            id = value,
            options = new
            {
                PreferredLanguage = currentLanguage,
                IncludeCountry = false,
                IncludeLocation = false,
                NormalizeCase = true,
                NormalizeTownCase = true,
                FixTownCounty = true,
                Formatter = "NoOrganisationFormatter",
                MaxLines = 4
            }
        };

        var retrieveResponse = await _data8HttpClient.Post<RetrieveResponse>(RetrieveEndpoint, retrieveRequest, cancellationToken);

        var lines = retrieveResponse?.Result?.Address?.Lines?
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .ToList() ?? [];

        if (lines.Count < 2)
        {
            return new AddressResult();
        }

        var postcode = lines[^1];
        var townCity = lines[^2];
        var addressParts = lines.Take(lines.Count - 2).ToList();

        return new AddressResult
        {
            AddressLine1 = addressParts.ElementAtOrDefault(0) ?? string.Empty,
            AddressLine2 = addressParts.Count > 1
                ? string.Join(", ", addressParts.Skip(1))
                : string.Empty,
            TownCity = townCity,
            Postcode = postcode
        };
    }
}
