using Amazon.Lambda.TestUtilities;
using easyJet.Holidays.External.AWS.ImportWeatherData.Services;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.AWS.ImportWeatherData.Tests;

public class FunctionTests
{
    private readonly Mock<IWeatherDataImportHandler> _handler;

    private readonly Function _sut;

    public FunctionTests()
    {
        _handler = new();
        
        _sut = new Function(_handler.Object);
    }

    [Fact]
    public async Task Run_ForwardsCorrectly()
    {
        // Arrange

        // Act
        await _sut.Run(new TestLambdaContext());

        // Assert
        _handler.Verify(mock => mock.Handle());
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
