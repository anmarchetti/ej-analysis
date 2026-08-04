using Amazon.Lambda.Core;
using easyJet.Holidays.External.AWS.HbgHotelDiscountsSync.Services;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using System;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace easyJet.Holidays.External.AWS.HbgHotelDiscountsSync.Tests;

public class FunctionTests
{
    [Fact]
    public async Task Handler_Returns_Count_From_Service()
    {
        // Arrange
        var expectedCount = 5;
        var serviceMock = new Mock<IHbgHotelDiscountsService>();
        serviceMock.Setup(s => s.Sync(It.IsAny<CancellationToken>())).ReturnsAsync(expectedCount);

        var loggerMock = new Mock<ILogger<Function>>();
        var function = new Function(serviceMock.Object, loggerMock.Object);

        // Act
        var result = await function.Handler(Mock.Of<ILambdaContext>());

        // Assert
        result.Should().Be(expectedCount);
        serviceMock.Verify(s => s.Sync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handler_Propagates_Exception()
    {
        // Arrange
        var serviceMock = new Mock<IHbgHotelDiscountsService>();
        serviceMock.Setup(s => s.Sync(It.IsAny<CancellationToken>())).ThrowsAsync(new InvalidOperationException("failure"));
        var loggerMock = new Mock<ILogger<Function>>();
        var function = new Function(serviceMock.Object, loggerMock.Object);

        // Act
        var act = async () => await function.Handler(Mock.Of<ILambdaContext>());

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("failure");
        serviceMock.Verify(s => s.Sync(It.IsAny<CancellationToken>()), Times.Once);
    }
}
