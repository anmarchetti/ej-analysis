using AutoFixture;
using easyJet.Holidays.External.AWS.FPSExport.Models;
using easyJet.Holidays.External.AWS.FPSExport.Service;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;

namespace easyJet.Holidays.External.AWS.FPSExport.Tests;

public class FunctionTests
{
    private readonly Mock<IFpsExportingService> _exportingService;

    private readonly IFixture _fixture;

    private readonly Function _sut;

    public FunctionTests()
    {
        _exportingService = new();
        Mock<ILogger<Function>> logger = new();

        _fixture = new Fixture();

        _sut = new(_exportingService.Object, logger.Object);
    }

    [Fact]
    public async Task Run_WhenInputIsNull_Throws()
    {
        // Arrange

        // Act
        var action = async () => await _sut.Run(null!);

        // Assert
        await action.Should().ThrowAsync<ArgumentNullException>();
    }

    [Fact]
    public async Task Run_ForwardsParamsToUnderlying()
    {
        // Arrange
        var input = new FpsExportInput()
        {
            RunType = _fixture.Create<string>()
        };

        // Act
        await _sut.Run(input);

        // Assert
        _exportingService.Verify(mock => mock.Export(It.Is<string>(arg => arg.Equals(input.RunType))));
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