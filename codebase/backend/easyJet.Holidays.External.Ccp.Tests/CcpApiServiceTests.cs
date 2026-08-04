using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Ccp.Api;
using easyJet.Holidays.External.Domain.Api;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Xunit;

namespace easyJet.Holidays.External.Ccp.Tests;

public sealed class CcpApiServiceTests : IDisposable
{
    private readonly CcpApiService _sut;
    private readonly HttpClient _httpClient;

    public CcpApiServiceTests()
    {
        CcpSettings ccpSettings = new()
        {
            CcpUrl = new Uri("https://api.ccp.com/"),
            ApiKey = "test-api-key-12345",
            DocumentRetrievalEndpoint = "documents"
        };

        EnvironmentBehaviourSettings envSettings = new();
        
        _httpClient = new HttpClient();
        var client = new CcpApiClient(_httpClient, Options.Create(ccpSettings), Options.Create(envSettings));
        _sut = new CcpApiService(client);
    }

    [Fact]
    public void Constructor_WithValidApiClient_CreatesInstance()
    {
        // Assert
        _sut.Should().NotBeNull();
        _sut.Should().BeAssignableTo<ApiService>();
    }

    [Fact]
    public void Name_ReturnsExpectedServiceName()
    {
        // Act
        var name = _sut.Name();

        // Assert
        name.Should().Be("CCP API service.");
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