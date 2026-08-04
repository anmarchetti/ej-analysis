using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Controllers;
using easyJet.Holidays.Tests.Domain;
using easyJet.Holidays.Tests.Domain.ComponentTests;
using FluentAssertions;
using System.Net;
using WireMock.RequestBuilders;
using WireMock.ResponseBuilders;
using Xunit;

namespace easyJet.Holidays.Api.ComponentTests.MediaCenter
{
    /// <summary>
    /// Component tests for <see cref="MediaCenterController"/>
    /// </summary>
    public class MediaCenterControllerTopicsTests : BaseComponentTest
    {
        [Trait("Api", "/api/v1.0/mediacenter/topics")]
        [Trait("Category", "Component")]
        [Fact]
        public async Task Articles_CmsResponseValid_200CmsData()
        {
            // Arrange
            var expectedResponse = ObjectUtils.MinifyJson("[\"Environment\"]");

            // Act
            var response = await Client.GetAsync($"/api/v1.0/mediacenter/topics");
            var content = await response.Content.ReadAsStringAsync();

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            content.Should().Be(expectedResponse);
        }

        [Trait("Api", "/api/v1.0/mediacenter/topics")]
        [Trait("Category", "Component")]
        [Fact]
        public async Task Articles_CmsNotAvailable_503WithErrorCode()
        {
            // Arrange
            var server = SpawnServer("CmsWireMockServer");
            server.Given(
                Request.Create()
                    .WithPath("/api/Article/GetTopics")
                    .UsingGet()
            )
            .AtPriority(1)
            .RespondWith(
                Response.Create()
                    .WithStatusCode(HttpStatusCode.InternalServerError)
            );

            ApplyConfigurationField("Cms:Host", server.Url);

            // Act
            var response = await Client.GetAsync($"/api/v1.0/mediacenter/topics");

            // Assert
            await response.AssertErrorResponse(ApiExceptionCodes.MediaCenterTopicsError, HttpStatusCode.InternalServerError);
        }
    }
}
