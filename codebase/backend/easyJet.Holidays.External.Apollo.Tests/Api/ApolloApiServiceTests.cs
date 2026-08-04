using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Apollo.Api;
using Microsoft.Extensions.Options;
using Xunit;

namespace easyJet.Holidays.External.Apollo.Tests.Api;

public class ApolloApiServiceTests
{
    [Fact]
    public void Constructor_NullSettings_ThrowsArgumentNullException()
    {
        using var httpClient = new HttpClient();
        var apiClient = new ApolloApiClient(httpClient, Options.Create(new EnvironmentBehaviourSettings()));

        Assert.Throws<ArgumentNullException>(() => new ApolloApiService(apiClient, null));
    }

    [Fact]
    public void DefaultTimeoutMilliSeconds_ReturnsConfiguredValue()
    {
        using var httpClient = new HttpClient();
        var apiClient = new ApolloApiClient(httpClient, Options.Create(new EnvironmentBehaviourSettings()));
        var settings = Options.Create(new ApolloSettings { TimeoutMilliSeconds = 6789 });

        var sut = new ApolloApiService(apiClient, settings);

        Assert.Equal(6789, sut.DefaultTimeoutMilliSeconds());
    }

    [Fact]
    public void Name_ReturnsExpectedValue()
    {
        using var httpClient = new HttpClient();
        var apiClient = new ApolloApiClient(httpClient, Options.Create(new EnvironmentBehaviourSettings()));
        var sut = new ApolloApiService(apiClient, Options.Create(new ApolloSettings()));

        Assert.Equal("Decision Personalize API service.", sut.Name());
    }
}
