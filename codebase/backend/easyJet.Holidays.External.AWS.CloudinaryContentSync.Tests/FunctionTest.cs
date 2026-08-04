using Amazon.Lambda.S3Events;
using easyJet.Holidays.External.AWS.CloudinaryContentSync.Services;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.AWS.CloudinaryContentSync.Tests;

public class FunctionTests
{
    private readonly Mock<ICloudinaryContentSyncHandler> _handler;

    private readonly Function _sut;

    public FunctionTests()
    {
        _handler = new();

        _sut = new Function(_handler.Object);
    }


    [Fact]
    public async Task Run_ForwardsCorrectly()
    {
        // Arrange
        var input = new S3Event();

        // Act
        await _sut.Handler(input);

        // Assert
        _handler.Verify(mock => mock.Handle(It.Is<S3Event>(param => param == input)));
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