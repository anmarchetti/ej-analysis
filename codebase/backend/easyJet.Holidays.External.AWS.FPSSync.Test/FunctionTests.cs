using Amazon.Lambda.SQSEvents;
using easyJet.Holidays.External.AWS.FPSSync.Services;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;

namespace easyJet.Holidays.External.AWS.FPSSync.Test;

public class FunctionTests
{
    private readonly Mock<IFpsSyncHandler> _handler;

    private readonly Function _sut;

    public FunctionTests()
    {
        _handler = new Mock<IFpsSyncHandler>();
        Mock<ILogger<Function>> logger = new();

        _sut = new Function(_handler.Object, logger.Object);
    }

    [Fact]
    public async Task Run_ForwardsCorrectly()
    {
        // Arrange
        var input = new SQSEvent();

        // Act
        await _sut.Run(input);

        // Assert
        _handler.Verify(mock => mock.HandleSync(It.Is<SQSEvent>(param => param == input)));
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