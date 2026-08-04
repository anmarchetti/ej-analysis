using Amazon.Lambda.TestUtilities;
using easyJet.Holidays.External.AWS.LivePriceSync.Models;
using easyJet.Holidays.External.AWS.LivePriceSync.Services;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.AWS.LivePriceSync.Tests;

public class FunctionTests
{
    private readonly Mock<ILivePriceSyncFlow> _flow;

    private readonly Function _sut;

    public FunctionTests()
    {
        _flow = new();
        Mock<ILogger<Function>> logger = new();

        _sut = new(_flow.Object, logger.Object);
    }

    [Fact]
    public async Task Sync_WhenInputIsNull_Throws()
    {
        // Arrange

        // Act
        var action = async () => await _sut.Sync(null, new TestLambdaContext());

        // Assert
        await action.Should().ThrowAsync<ArgumentNullException>();
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    public async Task Sync_OnMissingMarket_Throws(string market)
    {
        // Arrange
        var input = new LivePriceSyncInput() { Market = market };

        // Act
        var action = async () => await _sut.Sync(input, new TestLambdaContext());

        // Assert
        await action.Should().ThrowAsync<InvalidOperationException>();
    }

    [Fact]
    public async Task Sync_WithProperMarket_InvokesUnderlyingCorrectly()
    {
        // Arrange
        var input = new LivePriceSyncInput() { Market = "en" };

        // Act
        await _sut.Sync(input, new TestLambdaContext());

        // Assert
        _flow.Verify(mock => mock.Sync(It.Is<string>(param => param == "en")));
    }

    [Fact]
    public void Configure_PreparesDependenciesCorrectly()
    {
        // Arrange
        var services = new ServiceCollection();
        Startup.Configure(services, false);
        services.AddTransient<Function, Function>();

        var provider = services.BuildServiceProvider();

        // Act
        var action = () => provider.GetRequiredService<Function>();

        // Assert
        action.Should().NotThrow();
    }
}