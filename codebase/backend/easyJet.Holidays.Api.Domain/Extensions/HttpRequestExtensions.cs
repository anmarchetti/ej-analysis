namespace easyJet.Holidays.Api.Domain.Extensions;

/// <summary>
/// <see cref="HttpRequestMessage"/> extensions
/// </summary>
public static class HttpRequestExtensions
{
    /// <summary>
    /// Request property to associate timeout value with specific request, not http client
    /// </summary>
    private static readonly HttpRequestOptionsKey<TimeSpan?> TimeoutOptionsKey = new("RequestTimeout");

    /// <summary>
    /// Set request timeout property 
    /// </summary>
    /// <param name="request">Request instance</param>
    /// <param name="timeout">Request timeout</param>
    public static void SetTimeout(this HttpRequestMessage request, TimeSpan? timeout)
    {
        if (request == null)
        {
            throw new ArgumentNullException(nameof(request));
        }

        request.Options.Set(TimeoutOptionsKey, timeout);
    }
    /// <summary>
    /// Get timeout value from request options
    /// </summary>
    /// <param name="request">Request instance</param>
    /// <returns>Timeout value or null</returns>
    public static TimeSpan? GetTimeout(this HttpRequestMessage request)
    {
        if (request == null)
        {
            throw new ArgumentNullException(nameof(request));
        }
        if (request.Options.TryGetValue(TimeoutOptionsKey, out var timeout))
        {
            return timeout;
        }

        return null;
    }
}