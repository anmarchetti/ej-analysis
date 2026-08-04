using Amazon.Lambda.TestUtilities;
using easyJet.Holidays.External.AWS.FreeNightsDataSync.Services;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.AWS.FreeNightsDataSync.Tests;

public class FunctionTest
{
    private readonly Mock<IFreeNightsSyncService> _syncService;

    private readonly Function _sut;

    public FunctionTest()
    {
        _syncService = new();
        Mock<ILogger<Function>> logger = new();

        _sut = new(_syncService.Object, logger.Object);
    }

    [Fact]
    public async Task Run_CorrectlyDefersExecutionToUnderlying()
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
        services.AddTransient<Function>();

        var provider = services.BuildServiceProvider();

        // Act
        var action = () => provider.GetRequiredService<Function>();

        // Assert
        action.Should().NotThrow();
    }
}