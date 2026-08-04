using System.Net;
using Amazon.Runtime;
using easyJet.Holidays.Api.Domain.Interfaces.Aws;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Apollo.Models;
using easyJet.Holidays.External.Apollo.Services;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

#nullable enable

namespace easyJet.Holidays.External.Apollo.Tests.Services;

public class ApolloAwsRequestTemplateTests
{
    [Fact]
    public async Task GetGraphQlResponseAsync_IncludesConfiguredServiceNameInAuthorizationScope()
    {
        var credentialsProviderMock = new Mock<IAwsAssumeRoleCredentialsProvider>(MockBehavior.Strict);
        credentialsProviderMock
            .Setup(x => x.GetApolloCredentialsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ImmutableCredentials("access-key", "secret-key", "session-token"));

        var handler = new CapturingMessageHandler();
        using var httpClient = new HttpClient(handler);

        var apolloSettings = Options.Create(new ApolloSettings
        {
            AppSyncDomain = "test.appsync-api.eu-west-1.amazonaws.com",
            AwsBooking = new ApolloBookingAwsSettings
            {
                Algorithm = "AWS4-HMAC-SHA256",
                Region = "eu-west-1",
                Service = "appsync"
            }
        });

        var sut = new ApolloAwsRequestTemplate(httpClient, credentialsProviderMock.Object, apolloSettings);

        var endpoint = new Uri("https://abc123.appsync-api.eu-west-1.amazonaws.com/graphql");
        var request = new ApolloGraphQlRequest
        {
            Query = "query Test { __typename }",
            OperationName = "Test"
        };

        _ = await sut.GetGraphQlResponseAsync<Dictionary<string, object?>>(endpoint, request);

        Assert.NotNull(handler.AuthorizationHeaderValue);
        Assert.Contains("/eu-west-1/appsync/aws4_request", handler.AuthorizationHeaderValue, StringComparison.Ordinal);
        credentialsProviderMock.Verify(x => x.GetApolloCredentialsAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetGraphQlResponseAsync_VpceEndpoint_UsesConfiguredRegionInAuthorizationScope()
    {
        var credentialsProviderMock = new Mock<IAwsAssumeRoleCredentialsProvider>(MockBehavior.Strict);
        credentialsProviderMock
            .Setup(x => x.GetApolloCredentialsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ImmutableCredentials("access-key", "secret-key", "session-token"));

        var handler = new CapturingMessageHandler();
        using var httpClient = new HttpClient(handler);

        var apolloSettings = Options.Create(new ApolloSettings
        {
            AppSyncDomain = "vpce-test.appsync-api.eu-west-1.vpce.amazonaws.com",
            AwsBooking = new ApolloBookingAwsSettings
            {
                Algorithm = "AWS4-HMAC-SHA256",
                Region = "eu-west-1",
                Service = "appsync"
            }
        });

        var sut = new ApolloAwsRequestTemplate(httpClient, credentialsProviderMock.Object, apolloSettings);
        var endpoint = new Uri("https://vpce-123.appsync-api.eu-west-1.vpce.amazonaws.com/graphql");
        var request = new ApolloGraphQlRequest
        {
            Query = "query Test { __typename }",
            OperationName = "Test"
        };

        _ = await sut.GetGraphQlResponseAsync<Dictionary<string, object?>>(endpoint, request);

        Assert.Contains("/eu-west-1/appsync/aws4_request", handler.AuthorizationHeaderValue, StringComparison.Ordinal);
    }

    [Fact]
    public async Task GetGraphQlResponseAsync_SignedHeadersIncludeContentTypeAndSecurityToken()
    {
        var credentialsProviderMock = new Mock<IAwsAssumeRoleCredentialsProvider>(MockBehavior.Strict);
        credentialsProviderMock
            .Setup(x => x.GetApolloCredentialsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ImmutableCredentials("access-key", "secret-key", "session-token"));

        var handler = new CapturingMessageHandler();
        using var httpClient = new HttpClient(handler);
        var sut = new ApolloAwsRequestTemplate(httpClient, credentialsProviderMock.Object, CreateApolloSettings());
        var endpoint = new Uri("https://abc123.appsync-api.eu-west-1.amazonaws.com/graphql");
        var request = new ApolloGraphQlRequest
        {
            Query = "query Test { __typename }",
            OperationName = "Test"
        };

        _ = await sut.GetGraphQlResponseAsync<Dictionary<string, object?>>(endpoint, request);

        Assert.Contains("SignedHeaders=content-type;host;x-amz-content-sha256;x-amz-date;x-amz-security-token", handler.AuthorizationHeaderValue, StringComparison.Ordinal);
        Assert.Equal("application/json; charset=utf-8", handler.ContentTypeHeaderValue);
    }

    [Fact]
    public void Constructor_MissingAwsBookingSettings_Throws()
    {
        var credentialsProviderMock = new Mock<IAwsAssumeRoleCredentialsProvider>(MockBehavior.Strict);
        var settings = Options.Create(new ApolloSettings
        {
            AppSyncDomain = "test.appsync-api.eu-west-1.amazonaws.com"
        });
        using var httpClient = new HttpClient(new CapturingMessageHandler());

        Assert.Throws<ArgumentException>(() =>
            new ApolloAwsRequestTemplate(httpClient, credentialsProviderMock.Object, settings));
    }

    [Fact]
    public void Constructor_MissingAlgorithm_Throws()
    {
        var credentialsProviderMock = new Mock<IAwsAssumeRoleCredentialsProvider>(MockBehavior.Strict);
        var settings = Options.Create(new ApolloSettings
        {
            AppSyncDomain = "test.appsync-api.eu-west-1.amazonaws.com",
            AwsBooking = new ApolloBookingAwsSettings
            {
                Algorithm = "",
                Region = "eu-west-1",
                Service = "appsync"
            }
        });
        using var httpClient = new HttpClient(new CapturingMessageHandler());

        Assert.Throws<ArgumentException>(() =>
            new ApolloAwsRequestTemplate(httpClient, credentialsProviderMock.Object, settings));
    }

    [Fact]
    public void Constructor_MissingService_Throws()
    {
        var credentialsProviderMock = new Mock<IAwsAssumeRoleCredentialsProvider>(MockBehavior.Strict);
        var settings = Options.Create(new ApolloSettings
        {
            AppSyncDomain = "test.appsync-api.eu-west-1.amazonaws.com",
            AwsBooking = new ApolloBookingAwsSettings
            {
                Algorithm = "AWS4-HMAC-SHA256",
                Region = "eu-west-1",
                Service = ""
            }
        });
        using var httpClient = new HttpClient(new CapturingMessageHandler());

        Assert.Throws<ArgumentException>(() =>
            new ApolloAwsRequestTemplate(httpClient, credentialsProviderMock.Object, settings));
    }

    [Fact]
    public async Task GetGraphQlResponseAsync_WhenHttpStatusIsNotSuccess_ThrowsHttpRequestException()
    {
        var credentialsProviderMock = new Mock<IAwsAssumeRoleCredentialsProvider>(MockBehavior.Strict);
        credentialsProviderMock
            .Setup(x => x.GetApolloCredentialsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ImmutableCredentials("access-key", "secret-key", "session-token"));

        var handler = new CapturingMessageHandler(HttpStatusCode.InternalServerError, "{\"message\":\"error\"}");
        using var httpClient = new HttpClient(handler);
        var sut = new ApolloAwsRequestTemplate(httpClient, credentialsProviderMock.Object, CreateApolloSettings());

        await Assert.ThrowsAsync<HttpRequestException>(() => sut.GetGraphQlResponseAsync<Dictionary<string, object?>>(
            new Uri("https://abc123.appsync-api.eu-west-1.amazonaws.com/graphql"),
            new ApolloGraphQlRequest
            {
                Query = "query Test { __typename }",
                OperationName = "Test"
            }));
    }

    [Fact]
    public async Task GetGraphQlResponseAsync_WhenBodyDeserializesToNull_ThrowsInvalidOperationException()
    {
        var credentialsProviderMock = new Mock<IAwsAssumeRoleCredentialsProvider>(MockBehavior.Strict);
        credentialsProviderMock
            .Setup(x => x.GetApolloCredentialsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ImmutableCredentials("access-key", "secret-key", "session-token"));

        var handler = new CapturingMessageHandler(HttpStatusCode.OK, "null");
        using var httpClient = new HttpClient(handler);
        var sut = new ApolloAwsRequestTemplate(httpClient, credentialsProviderMock.Object, CreateApolloSettings());

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => sut.GetGraphQlResponseAsync<Dictionary<string, object?>>(
            new Uri("https://abc123.appsync-api.eu-west-1.amazonaws.com/graphql"),
            new ApolloGraphQlRequest
            {
                Query = "query Test { __typename }",
                OperationName = "Test"
            }));

        Assert.Equal("Apollo GraphQL response deserialized to null.", ex.Message);
    }

    [Fact]
    public async Task GetGraphQlResponseAsync_WhenTokenMissing_DoesNotIncludeSecurityTokenInSignedHeaders()
    {
        var credentialsProviderMock = new Mock<IAwsAssumeRoleCredentialsProvider>(MockBehavior.Strict);
        credentialsProviderMock
            .Setup(x => x.GetApolloCredentialsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ImmutableCredentials("access-key", "secret-key", string.Empty));

        var handler = new CapturingMessageHandler(HttpStatusCode.OK, "{}");
        using var httpClient = new HttpClient(handler);
        var sut = new ApolloAwsRequestTemplate(httpClient, credentialsProviderMock.Object, CreateApolloSettings());

        _ = await sut.GetGraphQlResponseAsync<Dictionary<string, object?>>(
            new Uri("https://abc123.appsync-api.eu-west-1.amazonaws.com/graphql?z=2&a=1"),
            new ApolloGraphQlRequest
            {
                Query = "query Test { __typename }",
                OperationName = "Test"
            });

        Assert.DoesNotContain("x-amz-security-token", handler.AuthorizationHeaderValue, StringComparison.Ordinal);
    }

    [Fact]
    public async Task GetGraphQlResponseAsync_WhenEndpointIsNull_ThrowsArgumentNullException()
    {
        var credentialsProviderMock = new Mock<IAwsAssumeRoleCredentialsProvider>(MockBehavior.Strict);
        using var httpClient = new HttpClient(new CapturingMessageHandler());
        var sut = new ApolloAwsRequestTemplate(httpClient, credentialsProviderMock.Object, CreateApolloSettings());

        await Assert.ThrowsAsync<ArgumentNullException>(() =>
            sut.GetGraphQlResponseAsync<Dictionary<string, object?>>(null!, new ApolloGraphQlRequest()));
    }

    [Fact]
    public async Task GetGraphQlResponseAsync_WhenRequestIsNull_ThrowsArgumentNullException()
    {
        var credentialsProviderMock = new Mock<IAwsAssumeRoleCredentialsProvider>(MockBehavior.Strict);
        using var httpClient = new HttpClient(new CapturingMessageHandler());
        var sut = new ApolloAwsRequestTemplate(httpClient, credentialsProviderMock.Object, CreateApolloSettings());

        await Assert.ThrowsAsync<ArgumentNullException>(() =>
            sut.GetGraphQlResponseAsync<Dictionary<string, object?>>(new Uri("https://abc123.appsync-api.eu-west-1.amazonaws.com/graphql"), null!));
    }

    private static IOptions<ApolloSettings> CreateApolloSettings()
    {
        return Options.Create(new ApolloSettings
        {
            AppSyncDomain = "test.appsync-api.eu-west-1.amazonaws.com",
            AwsBooking = new ApolloBookingAwsSettings
            {
                Algorithm = "AWS4-HMAC-SHA256",
                Region = "eu-west-1",
                Service = "appsync"
            }
        });
    }

    private sealed class CapturingMessageHandler : HttpMessageHandler
    {
        private readonly HttpStatusCode _statusCode;
        private readonly string _responseBody;

        public CapturingMessageHandler(HttpStatusCode statusCode = HttpStatusCode.OK, string responseBody = "{}")
        {
            _statusCode = statusCode;
            _responseBody = responseBody;
        }

        public string AuthorizationHeaderValue { get; private set; } = string.Empty;
        public string ContentTypeHeaderValue { get; private set; } = string.Empty;

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            request.Headers.TryGetValues("Authorization", out var authorizationValues);
            AuthorizationHeaderValue = authorizationValues?.FirstOrDefault() ?? string.Empty;
            ContentTypeHeaderValue = request.Content?.Headers.ContentType?.ToString() ?? string.Empty;

            return Task.FromResult(new HttpResponseMessage(_statusCode)
            {
                Content = new StringContent(_responseBody)
            });
        }
    }
}
