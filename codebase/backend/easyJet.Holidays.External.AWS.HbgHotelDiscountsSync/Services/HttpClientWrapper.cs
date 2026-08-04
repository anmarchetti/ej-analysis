using System.Net.Http.Json;
using easyJet.Holidays.External.AWS.HbgHotelDiscountsSync.Models;

namespace easyJet.Holidays.External.AWS.HbgHotelDiscountsSync.Services;

internal interface IHttpClientWrapper
{
    /// <summary>
    /// Retrieves discounted offers from the specified endpoint.
    /// </summary>
    /// <param name="endpoint">Fully qualified endpoint URL.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>List of discounted offers (empty list if none or error).</returns>
    Task<List<HbgHotelDiscountOffer>> GetOffers(string endpoint, CancellationToken cancellationToken);
}

internal sealed class HttpClientWrapper : IHttpClientWrapper
{
    private readonly HttpClient _httpClient;

    /// <summary>
    /// Initializes a new instance of <see cref="HttpClientWrapper"/>.
    /// </summary>
    /// <param name="httpClient">Injected <see cref="HttpClient"/> instance.</param>
    /// <exception cref="ArgumentNullException">Thrown when <paramref name="httpClient"/> is null.</exception>
    public HttpClientWrapper(HttpClient httpClient)
    {
        ArgumentNullException.ThrowIfNull(httpClient);
        _httpClient = httpClient;
    }

    /// <inheritdoc />
    public async Task<List<HbgHotelDiscountOffer>> GetOffers(string endpoint, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(endpoint))
        {
            return new List<HbgHotelDiscountOffer>();
        }

        try
        {
            var offers = await _httpClient
            .GetFromJsonAsync<List<HbgHotelDiscountOffer>>(endpoint, cancellationToken)
            .ConfigureAwait(false);
            return offers ?? new List<HbgHotelDiscountOffer>();
        }
        catch (HttpRequestException)
        {
            // Network or protocol error – return empty collection to keep sync resilient
            return new List<HbgHotelDiscountOffer>();
        }
        catch (TaskCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            // Propagate cancellation – but still return empty list to simplify caller logic
            return new List<HbgHotelDiscountOffer>();
        }
    }
}
