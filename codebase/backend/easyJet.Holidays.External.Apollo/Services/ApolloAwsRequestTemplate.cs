using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using easyJet.Holidays.Api.Domain.Interfaces.Aws;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Apollo.Models;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;

namespace easyJet.Holidays.External.Apollo.Services;

/// <summary>
/// Provides functionality to interact with Apollo AWS services using configured GraphQL requests.
/// </summary>
public class ApolloAwsRequestTemplate : IApolloAwsRequestTemplate
{
    private static readonly char[] normalizeSpaces = [' ', '\t'];
    private readonly HttpClient _httpClient;
    private readonly IAwsAssumeRoleCredentialsProvider _credentialsProvider;
    private readonly ApolloSettings _settings;
    private readonly ApolloBookingAwsSettings _awsBookingSettings;

    /// <summary>
    /// Provides a template for creating and managing signed requests to Apollo's AWS services.
    /// </summary>
    /// <param name="httpClient">The HTTP client instance for sending requests.</param>
    /// <param name="credentialsProvider">The provider for retrieving AWS credentials.</param>
    /// <param name="settings">The Apollo-specific settings, including AWS configuration details.</param>
    /// <exception cref="ArgumentNullException">Thrown when required dependencies or settings are null.</exception>
    /// <exception cref="ArgumentException">Thrown when required AWS settings are missing or invalid.</exception>
    public ApolloAwsRequestTemplate(
        HttpClient httpClient,
        IAwsAssumeRoleCredentialsProvider credentialsProvider,
        IOptions<ApolloSettings> settings)
    {
        _settings = settings?.Value ?? throw new ArgumentNullException(nameof(settings));
        _httpClient = httpClient ?? throw new ArgumentNullException(nameof(httpClient));
        _credentialsProvider = credentialsProvider ?? throw new ArgumentNullException(nameof(credentialsProvider));
        _awsBookingSettings = _settings.AwsBooking
            ?? throw new ArgumentException("Apollo:AwsBooking settings must be configured.", nameof(settings));
        if (string.IsNullOrWhiteSpace(_awsBookingSettings.Algorithm))
        {
            throw new ArgumentException("Apollo:AwsBooking:Algorithm must be configured.", nameof(settings));
        }

        if (string.IsNullOrWhiteSpace(_awsBookingSettings.Service))
        {
            throw new ArgumentException("Apollo:AwsBooking:ServiceName must be configured.", nameof(settings));
        }
    }

    /// <summary>
    /// Sends a signed Apollo GraphQL request using SigV4 and deserializes the response body.
    /// </summary>
    public async Task<TResponse> GetGraphQlResponseAsync<TResponse>(
        Uri endpoint,
        ApolloGraphQlRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(endpoint);
        ArgumentNullException.ThrowIfNull(request);

        var requestBody = JsonConvert.SerializeObject(request, new JsonSerializerSettings
        {
            NullValueHandling = NullValueHandling.Ignore
        });
        var credentials = await _credentialsProvider.GetApolloCredentialsAsync(cancellationToken);
        var signingRegion = _settings.AwsBooking.Region;

        using var httpRequest = BuildSignedRequest(
            HttpMethod.Post,
            endpoint,
            requestBody,
            credentials,
            _awsBookingSettings.Algorithm,
            _settings.AppSyncDomain,
            signingRegion,
            _awsBookingSettings.Service);
        using var response = await _httpClient.SendAsync(httpRequest, cancellationToken);
        var content = await response.Content.ReadAsStringAsync(cancellationToken);

        response.EnsureSuccessStatusCode();

        var apiResponse = JsonConvert.DeserializeObject<TResponse>(content);
        return apiResponse ?? throw new InvalidOperationException("Apollo GraphQL response deserialized to null.");
    }

    /// <summary>
    /// Builds an HTTP request and computes all AWS SigV4 headers for the configured service.
    /// </summary>
    private static HttpRequestMessage BuildSignedRequest(
        HttpMethod method,
        Uri endpoint,
        string requestBody,
        Amazon.Runtime.ImmutableCredentials credentials,
        string algorithm,
        string appSyncDomain,
        string signingRegion,
        string serviceName)
    {
        var utcNow = DateTime.UtcNow;
        var amzDate = utcNow.ToString("yyyyMMddTHHmmssZ", CultureInfo.InvariantCulture);
        var dateStamp = utcNow.ToString("yyyyMMdd", CultureInfo.InvariantCulture);

        // Sign exactly the same Content-Type header value that will be sent on the wire.
        var content = new StringContent(requestBody, Encoding.UTF8, "application/json");
        var contentTypeHeaderValue = content.Headers.ContentType?.ToString() ?? "application/json";

        var payloadHash = ToHex(HashSha256(requestBody));
        var host = endpoint.IsDefaultPort ? endpoint.Host : $"{endpoint.Host}:{endpoint.Port}";
        var canonicalUri = CanonicalUri(endpoint);
        var canonicalQueryString = CanonicalQueryString(endpoint.Query);

        var headers = new SortedDictionary<string, string>(StringComparer.Ordinal)
        {
            ["content-type"] = contentTypeHeaderValue,
            ["host"] = host,
            ["x-amz-content-sha256"] = payloadHash,
            ["x-amz-date"] = amzDate
        };

        if (!string.IsNullOrWhiteSpace(credentials.Token))
        {
            headers["x-amz-security-token"] = credentials.Token;
        }

        var canonicalHeaders = string.Join(string.Empty, headers.Select(kv => $"{kv.Key}:{NormalizeSpaces(kv.Value)}\n"));
        var signedHeaders = string.Join(";", headers.Keys);

        var canonicalRequest = string.Join("\n",
            method.Method,
            canonicalUri,
            canonicalQueryString,
            canonicalHeaders,
            signedHeaders,
            payloadHash);

        // Scope must include date/region/service to produce a valid SigV4 signature.
        var credentialScope = $"{dateStamp}/{signingRegion}/{serviceName}/aws4_request";
        var stringToSign = string.Join("\n",
            algorithm,
            amzDate,
            credentialScope,
            ToHex(HashSha256(canonicalRequest)));

        var signingKey = GetSigningKey(credentials.SecretKey, dateStamp, signingRegion, serviceName);
        var signature = ToHex(Sign(signingKey, stringToSign));
        var authorizationHeader =
            $"{algorithm} Credential={credentials.AccessKey}/{credentialScope}, SignedHeaders={signedHeaders}, Signature={signature}";

        var httpRequest = new HttpRequestMessage(method, endpoint)
        {
            Content = content
        };

        httpRequest.Headers.TryAddWithoutValidation("x-appsync-domain", appSyncDomain);
        httpRequest.Headers.TryAddWithoutValidation("x-amz-date", amzDate);
        httpRequest.Headers.TryAddWithoutValidation("x-amz-content-sha256", payloadHash);
        httpRequest.Headers.TryAddWithoutValidation("Authorization", authorizationHeader);

        if (!string.IsNullOrWhiteSpace(credentials.Token))
        {
            httpRequest.Headers.TryAddWithoutValidation("x-amz-security-token", credentials.Token);
        }

        return httpRequest;
    }

    private static string CanonicalUri(Uri uri)
    {
        var path = string.IsNullOrEmpty(uri.AbsolutePath) ? "/" : uri.AbsolutePath;
        var segments = path.Split('/', StringSplitOptions.None).Select(UriEncode);
        return string.Join("/", segments);
    }

    private static string CanonicalQueryString(string query)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return string.Empty;
        }

        var pairs = query.TrimStart('?')
            .Split('&', StringSplitOptions.RemoveEmptyEntries)
            .Select(pair =>
            {
                var tokens = pair.Split('=', 2);
                var key = UriDecode(tokens[0]);
                var value = tokens.Length == 2 ? UriDecode(tokens[1]) : string.Empty;
                return (Key: UriEncode(key), Value: UriEncode(value));
            })
            .OrderBy(x => x.Key, StringComparer.Ordinal)
            .ThenBy(x => x.Value, StringComparer.Ordinal);

        return string.Join("&", pairs.Select(x => $"{x.Key}={x.Value}"));
    }

    private static byte[] HashSha256(string input)
    {
        var data = Encoding.UTF8.GetBytes(input);
        return SHA256.HashData(data);
    }

    private static byte[] Sign(byte[] key, string data)
    {
        using var hmac = new HMACSHA256(key);
        return hmac.ComputeHash(Encoding.UTF8.GetBytes(data));
    }

    /// <summary>
    /// Derives the SigV4 signing key using date, region, and service scope.
    /// </summary>
    private static byte[] GetSigningKey(string secretAccessKey, string dateStamp, string region, string serviceName)
    {
        var kDate = Sign(Encoding.UTF8.GetBytes($"AWS4{secretAccessKey}"), dateStamp);
        var kRegion = Sign(kDate, region);
        var kService = Sign(kRegion, serviceName);
        return Sign(kService, "aws4_request");
    }

    private static string ToHex(byte[] data)
    {
#pragma warning disable CA1308 // we need to use invariant culture for hex conversion to match signV4 authentication string
        return Convert.ToHexString(data).ToLowerInvariant();
#pragma warning restore CA1308
    }

    private static string NormalizeSpaces(string value)
    {
        return string.Join(" ", value.Trim().Split(normalizeSpaces, StringSplitOptions.RemoveEmptyEntries));
    }

    private static string UriDecode(string value)
    {
        return Uri.UnescapeDataString(value.Replace("+", "%20", StringComparison.OrdinalIgnoreCase));
    }

    private static string UriEncode(string value)
    {
        return Uri.EscapeDataString(value)
            .Replace("%7E", "~", StringComparison.OrdinalIgnoreCase)
            .Replace("+", "%20", StringComparison.OrdinalIgnoreCase);
    }
}
