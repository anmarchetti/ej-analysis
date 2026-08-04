using Amazon.Lambda.TestUtilities;
using easyJet.Holidays.External.AWS.ErrataInfoSync.Interfaces;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.AWS.ErrataInfoSync.Tests;

public class FunctionTests
{
    private readonly Mock<IErrataInfoSyncFlow> _flow;

    private readonly Function _sut;

    public FunctionTests()
    {
        _flow = new();

        _sut = new(_flow.Object);
    }

    [Fact]
    public async Task Sync_CorrectlyInvokesUnderlying()
    {
        // Arrange

        // Act
        await _sut.Sync(new TestLambdaContext());

        // Assert
        _flow.Verify(mock => mock.Sync(), Times.Once);
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