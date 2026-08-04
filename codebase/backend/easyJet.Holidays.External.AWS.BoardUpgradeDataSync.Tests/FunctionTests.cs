using Amazon.Lambda.TestUtilities;
using easyJet.Holidays.External.AWS.BoardUpgradeDataSync.Services;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.AWS.BoardUpgradeDataSync.Tests;

public class FunctionTests
{
    private readonly Mock<IBoardUpgradeSyncingService> _syncService;
    private readonly Mock<ILogger<Function>> _logger;

    private readonly Function _sut;

    public FunctionTests()
    {
        _syncService = new();
        _logger = new();

        _sut = new(_syncService.Object, _logger.Object);
    }

    [Fact]
    public async Task Run_DefersProcessingCorrectly()
    {
        // Arrange

        // Act
        await _sut.Run(new TestLambdaContext());

        // Assert
        _syncService.Verify(mock => mock.Sync(), Times.Once);
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