using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using PointsOfInterest;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace easyJet.Holidays.External.AWS.PointsOfInterest.Tests;

public class StartupTests
{
    [Fact]
    public void Configure_PreparesDependenciesCorrectly()
    {
        // Arrange
        var services = new ServiceCollection();
        new Startup().ConfigureServices(services);
        services.AddTransient<Function, Function>();

        var provider = services.BuildServiceProvider();

        // Act
        var action = () => provider.GetRequiredService<Function>();

        // Assert
        action.Should().NotThrow();
    }
}