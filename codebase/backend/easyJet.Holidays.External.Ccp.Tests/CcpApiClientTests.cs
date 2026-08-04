using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Ccp.Api;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Xunit;

namespace easyJet.Holidays.External.Ccp.Tests;

public sealed class CcpApiClientTests : IDisposable
{
    private readonly CcpApiClient _sut;
    private readonly HttpClient _httpClient;
    private readonly CcpSettings _ccpSettings;
    private readonly EnvironmentBehaviourSettings _envSettings;

    public CcpApiClientTests()
    {
        _ccpSettings = new CcpSettings
        {
            CcpUrl = new Uri("https://api.ccp.com/"),
            ApiKey = "test-api-key-12345",
            DocumentRetrievalEndpoint = "documents"
        };

        _envSettings = new EnvironmentBehaviourSettings();
        
        _httpClient = new HttpClient();
        _sut = new CcpApiClient(_httpClient, Options.Create(_ccpSettings), Options.Create(_envSettings));
    }

    [Fact]
    public void Constructor_WithValidParameters_CreatesInstance()
    {
        // Assert
        _sut.Should().NotBeNull();
        _sut.MediaType.Should().Be("application/json");
    }

    [Fact]
    public void Constructor_WithNullCcpSettings_ThrowsArgumentNullException()
    {
        // Act & Assert
        Assert.Throws<ArgumentNullException>(() => 
            new CcpApiClient(_httpClient, null!, Options.Create(_envSettings)));
    }

    [Fact]
    public async Task PrepareRequestMessage_WithValidRequest_AddHeader()
    {
        // Arrange
        using var request = new HttpRequestMessage(HttpMethod.Get, "https://api.ccp.com/test");

        // Act
        await _sut.PrepareRequestMessage(request);

        // Assert
        request.Headers.Should().ContainKey("x-api-key");
        request.Headers.GetValues("x-api-key").Should().ContainSingle().Which.Should().Be(_ccpSettings.ApiKey);
    }

    private void Dispose(bool disposing)
    {
        if (disposing)
        {
            _httpClient.Dispose();
        }
    }

    public void Dispose()
    {
        Dispose(true);
    }
}