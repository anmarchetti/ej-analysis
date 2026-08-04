using Amazon.Lambda.TestUtilities;
using easyJet.Holidays.External.AWS.RequestedPriceSyncRunner.Services;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;

namespace easyJet.Holidays.External.AWS.RequestedPriceSyncRunner.Tests;

public class FunctionTests
{
    private readonly Mock<IRequestedPriceSyncRunnerHandler> _handler;
    private readonly Mock<ILogger<Function>> _logger;

    private readonly Function _sut;

    public FunctionTests()
    {
        _handler = new();
        _logger = new();

        _sut = new Function(
            _handler.Object,
            _logger.Object
        );
    }

    [Fact]
    internal async Task Sync_InvokesHandlerCorrectly()
    {
        // Arrange
        var ctx = new TestLambdaContext();

        // Act
        await _sut.Sync(ctx);

        // Assert
        _logger.Verify(mock => mock.BeginScope(It.IsAny<string>()), Times.Once);
        _handler.Verify(mock => mock.Sync(), Times.Once);
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