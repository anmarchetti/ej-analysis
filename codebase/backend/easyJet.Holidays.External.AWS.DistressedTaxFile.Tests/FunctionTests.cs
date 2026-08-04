using Amazon.Lambda.S3Events;
using easyJet.Holidays.External.AWS.DistressedTaxFile.Services;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.AWS.DistressedTaxFile.Tests;
public class FunctionTests
{
    private readonly Mock<IDistressedFileHandler> _handlerMock;
    private readonly Mock<ILogger<Function>> _loggerMock;

    private readonly Function _sut;

    public FunctionTests()
    {
        _handlerMock = new();
        _loggerMock = new();

        _sut = new(_handlerMock.Object, _loggerMock.Object);
    }

    public static TheoryData<S3Event> UnprocessableEvents =
    [
        new(null),
        new(new()),
        new(new(){Records = []})
    ];

    [Theory]
    [MemberData(nameof(UnprocessableEvents))]
    public async Task Run_WithUnprocessableEvent_DoesNotAttemptProcessing_Throws(S3Event input)
    {
        // Arrange

        // Act
        var action = async () => await _sut.Run(input);

        // Assert
        await action.Should().ThrowAsync<ArgumentNullException>();
        _handlerMock.Verify(mock => mock.Process(It.IsAny<S3Event.S3EventNotificationRecord>()), Times.Never);
        _loggerMock.Verify(LoggerTestUtils.VerifyForLogLevel<Function>(LogLevel.Error), Times.Once);
    }

    [Fact]
    public async Task Run_WithProcessableEvent_InvokesHandler()
    {
        // Arrange
        var input = new S3Event()
        {
            Records =
            [
                new S3Event.S3EventNotificationRecord()
            ]
        };

        // Act
        await _sut.Run(input);

        // Assert
        _handlerMock.Verify(mock => mock.Process(It.IsAny<S3Event.S3EventNotificationRecord>()), Times.Once);
        _loggerMock.Verify(LoggerTestUtils.VerifyForLogLevel<Function>(LogLevel.Error), Times.Never);
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