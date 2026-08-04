using Amazon.Lambda.S3Events;
using Amazon.Lambda.TestUtilities;
using easyJet.Holidays.External.AWS.RouteFileParser.Services;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.AWS.RouteFileParser.Tests;

public class FunctionTests
{

    private readonly Mock<IRouteFileProcessor> _processor;

    private readonly Function _sut;

    public FunctionTests()
    {
        _processor = new();
        Mock<ILogger<Function>> logger = new();

        _sut = new(_processor.Object, logger.Object);
    }

    [Fact]
    public async Task Run_OnMissingRecord_Throws()
    {
        // Arrange
        var input = new S3Event() { Records = [] };

        // Act
        var action = async () => await _sut.Run(input, new TestLambdaContext());

        // Assert
        await action.Should().ThrowAsync<InvalidOperationException>();
        _processor.Verify(mock => mock.SyncRoutes(It.IsAny<S3Event.S3EventNotificationRecord>()), Times.Never);
    }

    [Fact]
    public async Task Run_WithValidInput_InvokesUnderlying()
    {
        // Arrange
        var input = new S3Event()
        {
            Records =
            [
                new()
                {
                    S3 = new()
                    {
                        Object = new()
                        {
                            Key = "SomeKey"
                        }
                    },
                    EventName = "testEvent"
                }
            ]
        };

        // Act
        await _sut.Run(input, new TestLambdaContext());

        // Assert
        _processor.Verify(mock => mock.SyncRoutes(It.IsAny<S3Event.S3EventNotificationRecord>()), Times.Once);
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