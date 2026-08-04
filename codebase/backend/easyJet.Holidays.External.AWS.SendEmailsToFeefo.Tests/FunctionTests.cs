using Amazon.Lambda.SQSEvents;
using easyJet.Holidays.External.AWS.SendEmailsToFeefo.Services;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.AWS.SendEmailsToFeefo.Tests;

public class FunctionTests
{
    private readonly Mock<IFeefoProcessor> _processor;

    private readonly Function _sut;

    public FunctionTests()
    {
        _processor = new();

        _sut = new(_processor.Object);
    }

    [Fact]
    public async Task Run_WithNullEvent_InvokesWithEmptyList()
    {
        // Arrange
        _processor.Setup(mock => mock.Process(It.IsAny<List<SQSEvent.SQSMessage>>()))
            .ReturnsAsync(new SQSBatchResponse());

        // Act
        var result = await _sut.Run(null!);

        // Assert
        result.Should().NotBeNull();

        _processor.Verify(mock => mock.Process(It.Is<List<SQSEvent.SQSMessage>>(param => param != null)));
    }

    [Fact]
    public async Task Run_WithProperInput_InvokesWithContent()
    {
        // Arrange
        var input = new SQSEvent()
        {
            Records =
            [
                new(),
                new()
            ]
        };

        _processor.Setup(mock => mock.Process(It.IsAny<List<SQSEvent.SQSMessage>>()))
            .ReturnsAsync(new SQSBatchResponse());

        // Act
        var result = await _sut.Run(input);

        // Assert
        result.Should().NotBeNull();

        _processor.Verify(mock => mock.Process(
            It.Is<List<SQSEvent.SQSMessage>>(param => param != null && param.Count == input.Records.Count))
        );
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
