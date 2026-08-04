using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Net.Http.Json;
using System.Text.Json;

namespace easyJet.Holidays.External.Data8.Ancillaries;

/// <summary>
/// HTTP client abstraction for Data8 API requests.
/// </summary>
public interface IData8HttpClient
{
    /// <summary>
    /// Sends a POST request and deserializes the response to the specified type.
    /// </summary>
    /// <typeparam name="T">Response model type.</typeparam>
    /// <param name="endpoint">Relative Data8 endpoint path.</param>
    /// <param name="request">Request payload object.</param>
    /// <param name="cancellationToken">Request cancellation token.</param>
    /// <returns>Deserialized response model.</returns>
    Task<T> Post<T>(string endpoint, object request, CancellationToken cancellationToken);
}

/// <summary>
/// Default HTTP client for Data8 API communication.
/// </summary>
public class Data8HttpClient(HttpClient httpClient, ILogger<Data8HttpClient> logger, IOptions<Data8Settings> data8Settings)
    : IData8HttpClient
{
    private readonly JsonSerializerOptions _jsonSerializerOptions = new() { PropertyNameCaseInsensitive = true };

    private readonly System.Net.Http.HttpClient _httpClient = httpClient;
    private readonly ILogger<Data8HttpClient> _logger = logger;
    private readonly string _apiKey = data8Settings?.Value?.ApiKey ?? throw new ArgumentNullException(nameof(data8Settings));

    /// <inheritdoc />
    public async Task<T> Post<T>(string endpoint, object request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(endpoint);
        try
        {
            var endpointWithKey = endpoint.Contains('?', StringComparison.Ordinal)
                ? $"{endpoint}&key={Uri.EscapeDataString(_apiKey)}"
                : $"{endpoint}?key={Uri.EscapeDataString(_apiKey)}";

            using var response = await _httpClient.PostAsJsonAsync(endpointWithKey, request, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Data8 call to {Endpoint} failed with status code {StatusCode}.", endpoint,
                    response.StatusCode);
                return default!;
            }

            var content = await response.Content.ReadAsStringAsync(cancellationToken);
            if (string.IsNullOrWhiteSpace(content))
            {
                return default!;
            }

            return JsonSerializer.Deserialize<T>(content, _jsonSerializerOptions)!;
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (JsonException ex)
        {
            _logger.LogWarning(ex, "Failed to deserialize Data8 response from {Endpoint}.", endpoint);
            return default!;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Data8 call to {Endpoint} failed.", endpoint);
            return default!;
        }
    }
}
