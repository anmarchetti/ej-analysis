using System;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace easyJet.Holidays.External.AWS.HbgHotelDiscountsSync.Tests;

public class StartupTests
{
    [Fact]
    public void Configure_PreparesDependenciesCorrectly()
    {
        var accessKey = Environment.GetEnvironmentVariable("AWS_ACCESS_KEY_ID");
        var secretKey = Environment.GetEnvironmentVariable("AWS_SECRET_ACCESS_KEY");
        var sessionToken = Environment.GetEnvironmentVariable("AWS_SESSION_TOKEN");
        var region = Environment.GetEnvironmentVariable("AWS_REGION");
        var defaultRegion = Environment.GetEnvironmentVariable("AWS_DEFAULT_REGION");

        Environment.SetEnvironmentVariable("AWS_ACCESS_KEY_ID", "test");
        Environment.SetEnvironmentVariable("AWS_SECRET_ACCESS_KEY", "test");
        Environment.SetEnvironmentVariable("AWS_SESSION_TOKEN", "test");
        Environment.SetEnvironmentVariable("AWS_REGION", "eu-west-1");
        Environment.SetEnvironmentVariable("AWS_DEFAULT_REGION", "eu-west-1");

        // Arrange
        var services = new ServiceCollection();
        new Startup().ConfigureServices(services);
        services.AddTransient<Function, Function>();

        var provider = services.BuildServiceProvider();

        // Act
        var action = () => provider.GetRequiredService<Function>();

        // Assert
        action.Should().NotThrow();

        Environment.SetEnvironmentVariable("AWS_ACCESS_KEY_ID", accessKey);
        Environment.SetEnvironmentVariable("AWS_SECRET_ACCESS_KEY", secretKey);
        Environment.SetEnvironmentVariable("AWS_SESSION_TOKEN", sessionToken);
        Environment.SetEnvironmentVariable("AWS_REGION", region);
        Environment.SetEnvironmentVariable("AWS_DEFAULT_REGION", defaultRegion);
    }
}
