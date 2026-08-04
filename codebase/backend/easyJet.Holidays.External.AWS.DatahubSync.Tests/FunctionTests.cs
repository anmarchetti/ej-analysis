using Amazon.Lambda.SQSEvents;
using Amazon.Lambda.TestUtilities;
using easyJet.Holidays.External.AWS.DatahubSync.Services;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.AWS.DatahubSync.Tests;

public class FunctionTests
{
    private readonly Mock<IDatahubSyncHandler> _syncHandler;
    private readonly Mock<ILogger<Function>> _mockLogger;

    private readonly Function _sut;

    public FunctionTests()
    {
        _syncHandler = new();
        _mockLogger = new();

        _sut = new Function(
            _syncHandler.Object,
            _mockLogger.Object);
    }

    [Fact]
    public async Task Run_ForwardsCorrectly()
    {
        // Arrange
        var requestId = Guid.NewGuid().ToString();

        var testLambdaContext = new TestLambdaContext(){AwsRequestId = requestId};
        

        var input = new SQSEvent();

        // Act
        await _sut.Handler(input, testLambdaContext);

        // Assert
        _syncHandler.Verify(mock => mock.Handle(It.Is<SQSEvent>(param => param == input)));
        _mockLogger.Verify(mock => mock.BeginScope(It.Is<string>(param => param == requestId)));
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