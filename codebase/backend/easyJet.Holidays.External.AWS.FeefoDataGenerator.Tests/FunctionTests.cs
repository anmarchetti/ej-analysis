using Amazon.Lambda.TestUtilities;
using easyJet.Holidays.External.AWS.FeefoDataGenerator.Services;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.AWS.FeefoDataGenerator.Tests;

public class FunctionTests
{
    private readonly Mock<IFeefoDataGenerationHandler> _mockHandler;

    private readonly Function _sut;

    public FunctionTests()
    {
        _mockHandler = new();
        Mock<ILogger<Function>> mockLogger = new();

        _sut = new Function(
            _mockHandler.Object,
            mockLogger.Object
        );
    }

    [Fact]
    public async Task Handler_InvokesUnderlying()
    {
        // Arrange
        var ctx = new TestLambdaContext();

        // Act
        await _sut.Handler(ctx);

        // Assert
        _mockHandler.Verify(mock => mock.Generate(), Times.Once);
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
