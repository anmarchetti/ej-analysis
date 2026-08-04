using Amazon.Lambda.Core;
using Amazon.Lambda.SQSEvents;
using Amazon.Lambda.TestUtilities;
using AutoFixture;
using easyJet.Holidays.External.AWS.SalesforceSync.Services;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;

namespace easyJet.Holidays.External.AWS.SalesforceSync.Tests;

public class FunctionTests
{
    private readonly Mock<ISalesforceSyncHandler> _handler;
    private readonly Mock<ILogger<Function>> _logger;

    private readonly Fixture _fixture = new();

    private readonly Function _sut;

    public FunctionTests()
    {
        _handler = new();
        _logger = new();

        _fixture.Customize<SQSEvent.SQSMessage>(composer => composer.Without(s => s.MessageAttributes));

        _sut = new Function(
            _handler.Object,
            _logger.Object);
    }

    public static TheoryData<ILambdaContext?, string> ContextsAndExpectedRequestIds = new()
    {
        {null, string.Empty },
        {new TestLambdaContext(), string.Empty },
        {new TestLambdaContext(){AwsRequestId = "testRequest"}, "testRequest" }
    };

    [Theory]
    [MemberData(nameof(ContextsAndExpectedRequestIds))]
    internal async Task Handler_ForwardsCorrectly(ILambdaContext? ctx, string expectedId)
    {
        // Arrange
        var records = _fixture.Create<List<SQSEvent.SQSMessage>>();
        var @event = new SQSEvent() { Records = records };

        _handler.Setup(mock => mock.ProcessBatchAsync(It.IsAny<IEnumerable<SQSEvent.SQSMessage>>())).Returns(Task.FromResult(new SQSBatchResponse()));
        object? receivedScope = null;
        _logger.Setup(mock => mock.BeginScope(It.IsAny<object>())).Callback((object arg) => receivedScope = arg);

        // Act
        var result = await _sut.Handler(@event, ctx);

        // Assert
        result.Should().NotBeNull("we expect the underlying handlers result to be returned");

        _logger.Verify(mock => mock.BeginScope(It.IsAny<object>()), Times.Once());

        receivedScope.Should().NotBeNull();
        (receivedScope!.GetType().GetProperty("RequestId")!.GetValue(receivedScope) as string).Should()
            .BeEquivalentTo(expectedId, "this is the id that gets used for the logging scope");
        _handler.Verify(mock => mock.ProcessBatchAsync(records), Times.Once);
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