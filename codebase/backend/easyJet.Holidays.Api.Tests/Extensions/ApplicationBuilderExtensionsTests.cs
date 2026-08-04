using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Api.Extensions;
using FluentAssertions;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Moq;

namespace easyJet.Holidays.Api.Tests.Extensions;

public class ApplicationBuilderExtensionsTests
{
    [Fact]
    public void ConfigureSwagger_WhenSwaggerIsEnabled_ConfiguresAppBuilder()
    {
        // Arrange
        var settings = new ApiSettings()
        {
            EnableSwagger = true,
            RoutePrefix = new()
            {
                Swagger = "somePrefix"
            }
        };
        var serviceCollection = new ServiceCollection();
        serviceCollection.AddOptions();
        serviceCollection.AddRouting();
        serviceCollection.AddSingleton(Mock.Of<IWebHostEnvironment>());
        var provider = serviceCollection.BuildServiceProvider();
        var sut = new ApplicationBuilder(provider);

        // Act
        var action = () => sut.ConfigureSwagger(settings);

        // Assert
        action.Should().NotThrow();
    }

    [Fact]
    public void ConfigureSwagger_WhenSwaggerIsDisabled_ConfiguresAppBuilder()
    {
        // Arrange
        var settings = new ApiSettings() { EnableSwagger = false };
        var serviceCollection = new Mock<IServiceProvider>();
        var sut = new ApplicationBuilder(serviceCollection.Object);

        // Act
        var action = () => sut.ConfigureSwagger(settings);

        // Assert
        action.Should().NotThrow();
    }
}