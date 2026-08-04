using easyJet.Holidays.Api.Controllers;
using easyJet.Holidays.Tests.Domain;
using easyJet.Holidays.Tests.Domain.ComponentTests;
using easyJet.Holidays.Tests.Domain.Integration;
using FluentAssertions;
using System.Net;
using WireMock.RequestBuilders;
using WireMock.ResponseBuilders;
using WireMock.Settings;
using Xunit;

namespace easyJet.Holidays.Api.ComponentTests.Destinations
{
    /// <summary>
    /// Component tests for <see cref="DestinationController"/>
    /// </summary>
    public class DestinationControllerCountriesTests : BaseComponentTest
    {
        [Trait("Api", "/api/v1.0/destinations/countries")]
        [Trait("Category", "Component")]
        [Fact]
        public async Task Countries_CmsResponseValid_200CmsData()
        {
            // Arrange 
            var expectedResponse = ObjectUtils.MinifyJson(await File.ReadAllTextAsync(Path.Combine(Directory.GetCurrentDirectory(), "__admin", "files", "WebApi", "destinations_countries_response.json")));

            // Act
            var response = await Client.GetAsync($"/api/v1.0/destinations/countries");
            var content = await response.Content.ReadAsStringAsync();

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            content.Should().Be(expectedResponse);
        }

        [Trait("Api", "/api/v1.0/destinations/search")]
        [Trait("Category", "Component")]
        [Fact]
        public async Task SearchDestinations_CmsNotAvailable_DataFromCache()
        {
            // Arrange 
            var server = SpawnServer("CmsWireMockServer",
                new WireMockServerSettings
                {
                    FileSystemHandler = new CustomFolderFileSystemHandler(WiremockStaticMappingsBaseFolder, "CMS"),
                    StartAdminInterface = true,
                    ReadStaticMappings = true,
                    WatchStaticMappings = true,
                    WatchStaticMappingsInSubdirectories = true
                });

            // so, we are creating a copy of the cms server. while factory applies the new url,
            // it creates the new client and loads cache from the server copy
            // also reference data pre-load is disabled by default, so we enabling it to gather cache for this particular test
            ApplyManyConfigurationFields(
                new KeyValuePair<string, string>[]
                {
                    new("Cache:BackgroundRefreshDisabled", "false"),
                    new("EnvironmentBehaviour:PreloadReferenceDataOnStart", "true"),
                    new("Cms:Host", server.Url)
                });

            // then we hit reset+given, emulating, cms server failure/outage
            server.Reset();
            server.Given(
               Request.Create()
                   .WithPath("/api/DestinationsSearch/GetAllCountries")
                   .UsingGet()
            )
            .AtPriority(1)
            .RespondWith(
                Response.Create()
                    .WithStatusCode(HttpStatusCode.InternalServerError)
            );
            var expectedResponse = ObjectUtils.MinifyJson(await File.ReadAllTextAsync(Path.Combine(Directory.GetCurrentDirectory(), "__admin", "files", "WebApi", "destinations_countries_response.json")));

            // Act
            var response = await Client.GetAsync($"/api/v1.0/destinations/countries");
            var content = await response.Content.ReadAsStringAsync();

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            content.Should().Be(expectedResponse);
        }
    }
}