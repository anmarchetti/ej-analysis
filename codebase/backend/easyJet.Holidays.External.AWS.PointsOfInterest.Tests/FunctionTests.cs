using Moq;
using Microsoft.Extensions.Logging;
using PointsOfInterest;
using PointsOfInterest.Models;
using Amazon.Lambda.Core;
using LogLevel = Microsoft.Extensions.Logging.LogLevel;
using Xunit; // added for test attributes
using System.Collections.Generic; // added for List<>


namespace easyJet.Holidays.External.AWS.PointsOfInterest.Tests;

public class FunctionTests
{
    private readonly Mock<IPoiAggregator> _poiAggregatorMock;
    private readonly Mock<ILogger<Function>> _loggerMock;
    private readonly Mock<ILambdaContext> _lambdaContextMock;
    private readonly Function _function;

    public FunctionTests()
    {
        _poiAggregatorMock = new Mock<IPoiAggregator>();
        _loggerMock = new Mock<ILogger<Function>>();
        _lambdaContextMock = new Mock<ILambdaContext>();
        _function = new Function(_poiAggregatorMock.Object, _loggerMock.Object);
    }

    [Fact]
    public async Task FunctionHandler_NullRequest_UsesDefault()
    {
        var agg = new Mock<IPoiAggregator>();
        var fn = new Function(agg.Object, Mock.Of<ILogger<Function>>());

        await fn.Handler(null, Mock.Of<ILambdaContext>());

        agg.Verify(a => a.GeneratePOIsForResorts(It.Is<PoiGenerationRequest>(r => r.ResortCodes == null)), Times.Once);
    }

    [Fact]
    public async Task Handler_ValidRequest_LogsStartEndAndExecutesAggregator()
    {
        var request = new PoiGenerationRequest { ResortCodes = new List<string> { "A", "B" } }; // replaced collection expression

        await _function.Handler(request, _lambdaContextMock.Object);

        _poiAggregatorMock.Verify(x => x.GeneratePOIsForResorts(request), Times.Once);
        _loggerMock.VerifyLogContains(LogLevel.Information, "POI generation started. ResortIdsCount=2");
        _loggerMock.VerifyLogContains(LogLevel.Information, "POI generation completed.");
        _loggerMock.VerifyLogContains(LogLevel.Information, "POI generation total execution time");
    }

    [Fact]
    public async Task Handler_NullRequest_CreatesDefaultRequest_LogsCountZero()
    {
        await _function.Handler(null, _lambdaContextMock.Object);

        _poiAggregatorMock.Verify(x => x.GeneratePOIsForResorts(It.Is<PoiGenerationRequest>(r => r.ResortCodes == null)), Times.Once);
        _loggerMock.VerifyLogContains(LogLevel.Information, "POI generation started. ResortIdsCount=0");
        _loggerMock.VerifyLogContains(LogLevel.Information, "POI generation completed.");
        _loggerMock.VerifyLogContains(LogLevel.Information, "POI generation total execution time");
    }

    [Fact]
    public async Task Handler_RequestWithEmptyResortCodes_LogsCountZero()
    {
        var request = new PoiGenerationRequest { ResortCodes = new List<string>() }; // replaced collection expression

        await _function.Handler(request, _lambdaContextMock.Object);

        _poiAggregatorMock.Verify(x => x.GeneratePOIsForResorts(request), Times.Once);
        _loggerMock.VerifyLogContains(LogLevel.Information, "POI generation started. ResortIdsCount=0");
        _loggerMock.VerifyLogContains(LogLevel.Information, "POI generation completed.");
        _loggerMock.VerifyLogContains(LogLevel.Information, "POI generation total execution time");
    }

    [Fact]
    public async Task Handler_AggregatorThrowsPointsOfInterestException_LogsSpecificError()
    {
        _poiAggregatorMock
            .Setup(x => x.GeneratePOIsForResorts(It.IsAny<PoiGenerationRequest>()))
            .ThrowsAsync(new PointsOfInterestException("POI error"));

        await _function.Handler(new PoiGenerationRequest(), _lambdaContextMock.Object);

        _loggerMock.VerifyLogContains(LogLevel.Error, "POI generation failed with PointsOfInterestException.");
        _loggerMock.VerifyLogContains(LogLevel.Information, "POI generation total execution time");
    }

    [Fact]
    public async Task Handler_AggregatorThrowsGenericException_LogsErrorWithResolvedMessage()
    {
        _poiAggregatorMock
            .Setup(x => x.GeneratePOIsForResorts(It.IsAny<PoiGenerationRequest>()))
            .ThrowsAsync(new Exception("Unexpected error"));

        await _function.Handler(new PoiGenerationRequest(), _lambdaContextMock.Object);

        // Template placeholder {Message} is replaced by the logging infrastructure, so assert final rendered text.
        _loggerMock.VerifyLogContains(LogLevel.Error, "POI generation failed with unexpected exception message Unexpected error");
        _loggerMock.VerifyLogContains(LogLevel.Information, "POI generation total execution time");
    }

    [Fact]
    public void Constructor_NullAggregator_ThrowsArgumentNullException()
    {
        PoiAggregator poiAggregator = null!;
        Assert.Throws<ArgumentNullException>(() => new Function(poiAggregator, _loggerMock.Object));
    }

    [Fact]
    public void Constructor_NullLogger_ThrowsArgumentNullException()
    {
        Logger<Function> logger = null!;
        Assert.Throws<ArgumentNullException>(() => new Function(_poiAggregatorMock.Object, logger));
    }

    [Fact]
    public async Task Handler_Always_LogsExecutionTimeOnce()
    {
        await _function.Handler(new PoiGenerationRequest(), _lambdaContextMock.Object);

        _loggerMock.VerifyLogContains(LogLevel.Information, "POI generation total execution time", Times.Once());
    }
}

// Moq extensions for verifying log messages with rendered content
internal static class LoggerMockExtensions
{
    public static void VerifyLogContains<T>(this Mock<ILogger<T>> loggerMock, LogLevel level, string contains, Times? times = null)
    {
        loggerMock.Verify(
            x => x.Log(
                level,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => $"{v}".Contains(contains)),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            times ?? Times.AtLeastOnce());
    }
}