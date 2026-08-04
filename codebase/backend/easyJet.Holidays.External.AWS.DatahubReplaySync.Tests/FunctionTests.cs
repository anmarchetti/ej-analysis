using Amazon.Lambda.S3Events;
using easyJet.Holidays.External.AWS.DatahubReplaySync.Services;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.AWS.DatahubReplaySync.Tests;

public class FunctionTests
{
    private readonly Mock<IDatahubReplaySyncHandler> _handler;
    private readonly Mock<ILogger<Function>> _logger;

    private readonly Function _sut;

    public FunctionTests()
    {
        _handler = new();
        _logger = new();

        _sut = new(_handler.Object, _logger.Object);
    }

    public static readonly TheoryData<S3Event?> UnprocessableEvents = [new(null), new(new()), new(new() { Records = [] })];

    [Theory]
    [MemberData(nameof(UnprocessableEvents))]
    public async Task Handler_WhenInputIsNull_SkipsProcessing(S3Event? input)
    {
        // Arrange

        // Act
        await _sut.Handler(input);

        // Assert

        _handler.Verify(mock => mock.Process(It.IsAny<S3Event>()), Times.Never);

        _logger.Verify(LoggerTestUtils.VerifyForLogLevel<Function>(LogLevel.Warning), Times.AtLeastOnce);
    }

    [Fact]
    public async Task Handler_WhenInputIsNotNull_InvokesProcessing()
    {
        // Arrange
        var input = new S3Event()
        {
            Records = 
            [
                new()
            ]
        };

        // Act
        await _sut.Handler(input);

        // Assert
        _handler.Verify(mock => mock.Process(It.Is<S3Event>(param => param == input)), Times.Once);
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