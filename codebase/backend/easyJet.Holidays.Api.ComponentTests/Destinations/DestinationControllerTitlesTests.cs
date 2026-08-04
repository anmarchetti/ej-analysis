using AutoFixture.Xunit3;
using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Controllers;
using easyJet.Holidays.Tests.Domain;
using easyJet.Holidays.Tests.Domain.ComponentTests;
using FluentAssertions;
using Newtonsoft.Json;
using System.Net;
using System.Text;
using WireMock.RequestBuilders;
using WireMock.ResponseBuilders;
using Xunit;

namespace easyJet.Holidays.Api.ComponentTests.Destinations
{
    /// <summary>
    /// Component tests for <see cref="DestinationController"/>
    /// </summary>
    public class DestinationControllerTitlesTests : BaseComponentTest
    {
        [Trait("Category", "Component")]
        [Trait("Api", "/api/v1.0/destinations/title")]
        [Theory]
        [InlineAutoData("Valid request", new[] { "ES", "ESMJ0001" }, HttpStatusCode.OK)]
        [InlineAutoData("No codes", null, HttpStatusCode.BadRequest)]
        [InlineAutoData("Empty collection", new string[0], HttpStatusCode.BadRequest)]
        public async Task Titles_ValidateRequest(string because, string[] codes, HttpStatusCode status)
        {
            // Arrange 
            var query = $"/api/v1.0/destinations/title";
            var body = JsonConvert.SerializeObject(new
            {
                codes
            });

            // Act
            var response = await Client.PostAsync(query, new StringContent(body, Encoding.UTF8, "application/json"));

            // Assert
            response.StatusCode.Should().Be(status, because);
        }

        [Trait("Category", "Component")]
        [Trait("Api", "/api/v1.0/destinations/title")]
        [Fact]
        public async Task Titles_ReturnCmsResult()
        {
            // Arrange 
            var expectedResponse = ObjectUtils.MinifyJson(await File.ReadAllTextAsync(Path.Combine(Directory.GetCurrentDirectory(), "__admin", "files", "WebApi", "destinations_title_ES_ESMJ0001.json")));

            var query = $"/api/v1.0/destinations/title";
            var body = JsonConvert.SerializeObject(new
            {
                codes = new[] { "ES", "ESMJ0001" }
            });

            // Act
            var response = await Client.PostAsync(query, new StringContent(body, Encoding.UTF8, "application/json"));
            var content = await response.Content.ReadAsStringAsync();

            // Assert
            content.Should().Be(expectedResponse);
        }

        [Trait("Category", "Component")]
        [Trait("Api", "/api/v1.0/destinations/title")]
        [Fact]
        public async Task Titles_UsesCache()
        {
            // Arrange 
            var query = $"/api/v1.0/destinations/title";

            // We don't have mapping for all threes codes, only for 2 and 1. That's why it should fail if all 3 codes will be requested at once
            // First of all get 2 codes which should be cached
            var firstTwoBody = JsonConvert.SerializeObject(new
            {
                codes = new[] { "ES", "ESMJ0001" }
            });
            await Client.PostAsync(query, new StringContent(firstTwoBody, Encoding.UTF8, "application/json"));

            var expectedResponse = ObjectUtils.MinifyJson(await File.ReadAllTextAsync(Path.Combine(Directory.GetCurrentDirectory(), "__admin", "files", "WebApi", "destinations_title_ES_ESMJ_ESMJ0001.json")));

            // Act
            var body = JsonConvert.SerializeObject(new
            {
                codes = new[] { "ES", "ESMJ", "ESMJ0001" }
            });
            var response = await Client.PostAsync(query, new StringContent(body, Encoding.UTF8, "application/json"));
            var content = await response.Content.ReadAsStringAsync();

            // Assert
            content.Should().Be(expectedResponse);
        }

        [Trait("Category", "Component")]
        [Trait("Api", "/api/v1.0/destinations/title")]
        [Fact]
        public async Task LocationImage_CMSError_500WithError()
        {
            // Arrange 
            var server = SpawnServer("CmsWireMockServer");
            server.Given(
               Request.Create()
                   .WithPath("/api/DestinationsSearch/GetTitles")
                   .UsingPost()
           )
            .AtPriority(0)
            .RespondWith(
               Response.Create()
                   .WithStatusCode(HttpStatusCode.InternalServerError)
            );

            var query = $"/api/v1.0/destinations/title";
            var body = JsonConvert.SerializeObject(new
            {
                codes = new[] { "ES", "ESMJ0001" }
            });

            ApplyConfigurationField("Cms:Host", server.Url);

            // Act
            var response = await Client.PostAsync(query, new StringContent(body, Encoding.UTF8, "application/json"));

            // Assert
            await response.AssertErrorResponse(ApiExceptionCodes.DestinationsTitlesError, HttpStatusCode.InternalServerError);
        }
    }
}
