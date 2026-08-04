using easyJet.Holidays.Api.ComponentTests.Infrastructure;
using easyJet.Holidays.Tests.Domain;
using easyJet.Holidays.Tests.Domain.ComponentTests;
using FluentAssertions;
using System.Net;
using Xunit;

namespace easyJet.Holidays.Api.ComponentTests.Excursions;

public class ExcursionControllerGetActivitiesTests : BaseFixtureAwareComponentTest
{
    public ExcursionControllerGetActivitiesTests(WebApplicationFixture webApp) : base(webApp)
    {
    }

    [Trait("Api", "/api/v1.0/excursions")]
    [Trait("Category", "Component")]
    [Theory]
    [InlineData("/api/v1.0/excursions?destinationCode=FR")]
    public async Task GetActivities_CountryCodeMapped_200ActivitiesData(string query)
    {
        // Arrange
        var expectedResponse = ObjectUtils.MinifyJson(await File.ReadAllTextAsync(Path.Combine(Directory.GetCurrentDirectory(), "__admin", "files", "WebApi", "excursions", "get_activities_info_FR.json")));

        // Act
        var response = await Client.GetAsync(query);
        var content = await response.Content.ReadAsStringAsync();

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        content.Should().Be(expectedResponse);
    }

    [Trait("Api", "/api/v1.0/excursions")]
    [Trait("Category", "Component")]
    [Theory]
    [InlineData("/api/v1.0/excursions?destinationCode=FRLY")]
    public async Task GetActivities_RegionCodeMapped_200ActivitiesData(string query)
    {
        // Arrange
        var expectedResponse = ObjectUtils.MinifyJson(await File.ReadAllTextAsync(Path.Combine(Directory.GetCurrentDirectory(), "__admin", "files", "WebApi", "excursions", "get_activities_info_FRLY.json")));

        // Act
        var response = await Client.GetAsync(query);
        var content = await response.Content.ReadAsStringAsync();

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        content.Should().Be(expectedResponse);
    }

    [Trait("Api", "/api/v1.0/excursions")]
    [Trait("Category", "Component")]
    [Theory]
    [InlineData("/api/v1.0/excursions?destinationCode=ITBR")]
    public async Task GetActivities_RegionCodeNotMapped_200ActivitiesData(string query)
    {
        // Arrange
        var expectedResponse = ObjectUtils.MinifyJson(await File.ReadAllTextAsync(Path.Combine(Directory.GetCurrentDirectory(), "__admin", "files", "WebApi", "excursions", "get_activities_info_ITBR.json")));

        // Act
        var response = await Client.GetAsync(query);
        var content = await response.Content.ReadAsStringAsync();

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        content.Should().Be(expectedResponse);
    }

    [Trait("Api", "/api/v1.0/excursions")]
    [Trait("Category", "Component")]
    [Theory]
    [InlineData("/api/v1.0/excursions?destinationCode=ESCB")]
    public async Task GetActivities_RegionCodeMultipleMapped_200ActivitiesData(string query)
    {
        // Arrange
        var expectedResponse = ObjectUtils.MinifyJson(await File.ReadAllTextAsync(Path.Combine(Directory.GetCurrentDirectory(), "__admin", "files", "WebApi", "excursions", "get_activities_info_ESCB.json")));

        // Act
        var response = await Client.GetAsync(query);
        var content = await response.Content.ReadAsStringAsync();

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        content.Should().Be(expectedResponse);
    }
}