using AutoFixture.Xunit3;
using easyJet.Holidays.Api.Common.Exceptions;
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
    /// Component tests for <see cref="SearchController"/>
    /// </summary>
    public class DestinationControllerSearchTests : BaseComponentTest
    {
        [Trait("Api", "/api/v1.0/destinations/search")]
        [Trait("Category", "Component")]
        [Theory]
        [InlineAutoData(null, HttpStatusCode.BadRequest)]
        [InlineAutoData("t", HttpStatusCode.BadRequest)]
        [InlineAutoData("  t  ", HttpStatusCode.BadRequest)]
        [InlineAutoData("t1", HttpStatusCode.BadRequest)]
        [InlineAutoData("t13", HttpStatusCode.OK)]
        public async Task SearchDestinations_ValidateRequest(string searchQuery, HttpStatusCode status)
        {
            // Arrange 
            // Setup CMS to return OK  - we don't care about response here
            var server = SpawnServer("CmsWireMockServer",
                new WireMockServerSettings
                {
                    FileSystemHandler = new CustomFolderFileSystemHandler(WiremockStaticMappingsBaseFolder, "CMS"),
                    StartAdminInterface = true,
                    ReadStaticMappings = true,
                    WatchStaticMappings = true,
                    WatchStaticMappingsInSubdirectories = true
                });
            server.Given(
                Request.Create()
                    .WithPath("/api/DestinationsSearch/Search")
                    .UsingGet()
            )
            .RespondWith(
                Response.Create()
                    .WithStatusCode(200)
                    .WithBodyAsJson(new { Destinations = new object[0] })
            );

            ApplyConfigurationField("Cms:Host", server.Url);

            // Act
            var response = await Client.GetAsync($"/api/v1.0/destinations/search?query={searchQuery}");

            // Assert
            response.StatusCode.Should().Be(status);
        }

        [Trait("Api", "/api/v1.0/destinations/search")]
        [Trait("Category", "Component")]
        [Fact]
        public async Task SearchDestinations_CmsResponseValid_200CmsData()
        {
            // Arrange 
            var expectedResponse = ObjectUtils.MinifyJson(await File.ReadAllTextAsync(Path.Combine(Directory.GetCurrentDirectory(), "__admin", "files", "WebApi", "destinations_search_majorca_response.json")));

            // Act
            var response = await Client.GetAsync($"/api/v1.0/destinations/search?query=majorca");
            var content = await response.Content.ReadAsStringAsync();

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            content.Should().Be(expectedResponse);
        }

        [Trait("Api", "/api/v1.0/destinations/search")]
        [Trait("Category", "Component")]
        [Fact]
        public async Task SearchDestinations_CmsResponseEmpty_200EmptyArray()
        {
            // Act
            var response = await Client.GetAsync($"/api/v1.0/destinations/search?query=nodata");
            var content = await response.Content.ReadAsStringAsync();

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            content.Should().Be(@"{""destinations"":[],""total"":0,""page"":0,""take"":0}");
        }

        [Trait("Api", "/api/v1.0/destinations/search")]
        [Trait("Category", "Component")]
        [Fact]
        public async Task SearchDestinations_CmsNotAvailable_503WithErrorCode()
        {
            // Arrange
            var server = SpawnServer("CmsWireMockServer", new WireMockServerSettings
            {
                FileSystemHandler = new CustomFolderFileSystemHandler(WiremockStaticMappingsBaseFolder, "CMS"),
                StartAdminInterface = true,
                ReadStaticMappings = true,
                WatchStaticMappings = true,
                WatchStaticMappingsInSubdirectories = true
            });
            server.Given(
               Request.Create()
                   .WithPath("/api/DestinationsSearch/Search")
                    .UsingGet()
            )
            .AtPriority(1)
            .RespondWith(
                Response.Create()
                    .WithStatusCode(HttpStatusCode.InternalServerError)
            );

            ApplyConfigurationField("Cms:Host", server.Url);

            // Act
            var response = await Client.GetAsync($"/api/v1.0/destinations/search?query=error");

            // Assert
            await response.AssertErrorResponse(ApiExceptionCodes.DestinationsSearchError, HttpStatusCode.InternalServerError);
        }
    }
}