using Microsoft.Extensions.Logging;
using System;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Security.Cryptography; // added for secure random
using System.Globalization; // for invariant culture date parsing

namespace PointsOfInterest.Ancillaries;

internal interface IHttpClientWrapper
{
    Task<TRequest> GetResponse<TRequest>(string url) where TRequest : class;

    Task<TResponse?> PostJson<TRequest, TResponse>(string url, TRequest payload, CancellationToken ct = default) where TResponse  : class;
}

internal sealed class HttpClientWrapper : IHttpClientWrapper
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<HttpClientWrapper> _logger;
    private static readonly JsonSerializerOptions _serializerOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = null, // preserve property names exactly
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull, // Ignore null values
    };

    // Retry settings (could be promoted to options later if needed)
    private const int MaxRetries = 4; // total attempts = MaxRetries + 1 (initial + retries)
    private static readonly TimeSpan BaseDelay = TimeSpan.FromMilliseconds(250);
    private static readonly TimeSpan MaxDelay = TimeSpan.FromSeconds(5);

    public HttpClientWrapper(HttpClient httpClient, ILogger<HttpClientWrapper> logger)
    {
        ArgumentNullException.ThrowIfNull(httpClient);
        ArgumentNullException.ThrowIfNull(logger);

        _httpClient = httpClient;
        _logger = logger;
    }
    public async Task<TRequest> GetResponse<TRequest>(string url) where TRequest : class
    {
        using var resp = await _httpClient.GetAsync(new Uri(url));
        resp.EnsureSuccessStatusCode();

        var json = await resp.Content.ReadAsStringAsync();
        var data = JsonSerializer.Deserialize<TRequest>(json, _serializerOptions); // use same options as POST
        if (data is null)
        {
            _logger.LogError("GET {Url} returned null data", url);
            throw new PointsOfInterestException($"GET {url} returned null data");
        }
        return data;
    }

    public async Task<TResponse?> PostJson<TRequest, TResponse>(string url, TRequest payload, CancellationToken ct = default) where TResponse : class
    {
        var jsonPayload = JsonSerializer.Serialize(payload, _serializerOptions);
        _logger.LogInformation("POST {Url} - Sending payload: {JsonPayload}", url, jsonPayload);

        var totalAttempts = MaxRetries + 1; // initial + retries
        for (int attempt = 0; attempt < totalAttempts; attempt++)
        {
            HttpResponseMessage? resp = null;
            try
            {
                resp = await _httpClient.PostAsJsonAsync(url, payload, _serializerOptions, ct);

                if (resp.IsSuccessStatusCode)
                {
                    var responseContent = await resp.Content.ReadAsStringAsync(ct);
                    _logger.LogInformation("POST {Url} - Received response: {ResponseContent}", url, responseContent);
                    var data = await resp.Content.ReadFromJsonAsync<TResponse>(_serializerOptions, ct);
                    if (data == null)
                    {
                        _logger.LogError("POST {Url} returned null data", url);
                        throw new PointsOfInterestException($"POST {url} returned null data");
                    }
                    return data;
                }

                var isRetryable = ShouldRetry(resp.StatusCode);
                if (!isRetryable || attempt == MaxRetries)
                {
                    // Log body for final attempt / non-retryable
                    var errorBody = await SafeReadBody(resp, ct);
                    _logger.LogError("POST {Url} failed ({StatusCode}) after {Attempts} attempts. Body: {Body}", url, resp.StatusCode, attempt + 1, errorBody);
                    resp.EnsureSuccessStatusCode(); // will throw
                }
                else
                {
                    var delay = GetRetryDelay(resp, attempt);
                    var errorBody = await SafeReadBody(resp, ct);
                    _logger.LogWarning("POST {Url} transient failure ({StatusCode}) attempt {Attempt}/{Total}. Retrying after {DelayMs}ms. Body: {Body}",
                        url, (int)resp.StatusCode, attempt + 1, totalAttempts, (int)delay.TotalMilliseconds, Truncate(errorBody, 500));
                    await Task.Delay(delay, ct);
                }
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested)
            {
                throw; // propagate cancellation
            }
            catch (Exception ex) when (attempt < MaxRetries && IsTransient(ex))
            {
                var delay = ExponentialBackoffWithJitter(attempt);
                _logger.LogWarning(ex, "POST {Url} exception attempt {Attempt}/{Total}. Retrying after {DelayMs}ms", url, attempt + 1, totalAttempts, (int)delay.TotalMilliseconds);
                await Task.Delay(delay, ct);
            }
            finally
            {
                resp?.Dispose();
            }
        }

        // If we exit the loop without returning or throwing, throw a generic failure (should be unreachable)
        throw new HttpRequestException($"POST {url} failed after {MaxRetries + 1} attempts");
    }

    private static bool IsTransient(Exception ex)
    {
        // Don't retry logical POI exceptions
        if (ex is PointsOfInterestException) return false;

        if (ex is HttpRequestException hre)
        {
            if (hre.StatusCode is HttpStatusCode sc)
            {
                return ShouldRetry(sc); // only retry if status is transient
            }
            // No status code -> network connectivity -> treat as transient
            return true;
        }
        // Other exceptions (serialization, network) are considered transient
        return true;
    }

    private static bool ShouldRetry(HttpStatusCode status) => status == HttpStatusCode.TooManyRequests
        || status == HttpStatusCode.RequestTimeout
        || status == HttpStatusCode.InternalServerError
        || status == HttpStatusCode.BadGateway
        || status == HttpStatusCode.ServiceUnavailable
        || status == HttpStatusCode.GatewayTimeout;

    private static async Task<string> SafeReadBody(HttpResponseMessage resp, CancellationToken ct)
    {
        try { return await resp.Content.ReadAsStringAsync(ct); } catch { return "<unavailable>"; }
    }

    private static TimeSpan GetRetryDelay(HttpResponseMessage resp, int attempt)
    {
        // Honor Retry-After / x-amz-retry-after headers if present
        if (resp.Headers.TryGetValues("Retry-After", out var retryAfterValues))
        {
            var v = FirstOrDefault(retryAfterValues);
            if (TryParseRetryAfter(v, out var delay)) return Cap(delay);
        }
        if (resp.Headers.TryGetValues("x-amz-retry-after", out var amzRetryAfter))
        {
            var v = FirstOrDefault(amzRetryAfter);
            if (TryParseRetryAfter(v, out var delay)) return Cap(delay);
        }
        return ExponentialBackoffWithJitter(attempt);
    }

    private static string? FirstOrDefault(IEnumerable<string> src) => src.FirstOrDefault();

    private static bool TryParseRetryAfter(string? raw, out TimeSpan delay)
    {
        delay = default;
        if (string.IsNullOrWhiteSpace(raw)) return false;
        if (int.TryParse(raw, NumberStyles.Integer, CultureInfo.InvariantCulture, out var seconds)) { delay = TimeSpan.FromSeconds(seconds); return true; }
        // RFC 7231 date format for Retry-After should be IMF-fixdate => "R" (RFC1123) pattern
        if (DateTimeOffset.TryParseExact(raw, "R", CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal, out var when))
        {
            var span = when - DateTimeOffset.UtcNow;
            if (span > TimeSpan.Zero) { delay = span; return true; }
        }
        return false;
    }

    private static TimeSpan ExponentialBackoffWithJitter(int attempt)
    {
        var exp = TimeSpan.FromMilliseconds(BaseDelay.TotalMilliseconds * Math.Pow(2, attempt));
        // Use cryptographically strong randomness for jitter (CA5394)
        var jitterMillis = RandomNumberGenerator.GetInt32(0, 150);
        var jitter = TimeSpan.FromMilliseconds(jitterMillis);
        return Cap(exp + jitter);
    }

    private static TimeSpan Cap(TimeSpan delay) => delay > MaxDelay ? MaxDelay : delay;

    private static string Truncate(string? s, int max)
    {
        if (string.IsNullOrEmpty(s)) return string.Empty;
        return s.Length <= max ? s : s[..max] + "…";
    }
}