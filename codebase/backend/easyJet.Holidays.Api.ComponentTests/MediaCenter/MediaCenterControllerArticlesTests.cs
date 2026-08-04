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

namespace easyJet.Holidays.Api.ComponentTests.MediaCenter
{
    /// <summary>
    /// Component tests for <see cref="MediaCenterController"/>
    /// </summary>
    public class MediaCenterControllerArticlesTests : BaseComponentTest
    {
        [Trait("Api", "/api/v1.0/mediacenter/search")]
        [Trait("Category", "Component")]
        [Fact]
        public async Task Articles_CmsResponseValid_200CmsData()
        {
            // Arrange
            var expectedResponse = ObjectUtils.MinifyJson(await File.ReadAllTextAsync(Path.Combine(Directory.GetCurrentDirectory(), "__admin", "files", "WebApi", "mediacenter_articles_response.json")));

            var body = JsonConvert.SerializeObject(new
            {
                Take = 1,
                Page = 2,
                Offset = 0,
                StartDate = DateTime.MinValue,
                EndDate = DateTime.MaxValue,
                Query = "fakeQuery",
                Topics = new[] { "Environment", "Nature" }
            });

            // Act
            var response = await Client.PostAsync($"/api/v1.0/mediacenter/search", new StringContent(body, Encoding.UTF8, "application/json"));
            var content = await response.Content.ReadAsStringAsync();

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            content.Should().Be(expectedResponse);
        }

        [Trait("Api", "/api/v1.0/mediacenter/articles/search")]
        [Trait("Category", "Component")]
        [Theory]
        [InlineAutoData(1, 2)]
        public async Task Articles_CmsNotAvailable_503WithErrorCode(int take, int page)
        {
            // Arrange
            var server = SpawnServer("CmsWireMockServer");
            server.Given(
                Request.Create()
                    .WithPath("/api/Article/Search")
                    .UsingPost()
            )
            .AtPriority(1)
            .RespondWith(
                Response.Create()
                    .WithStatusCode(HttpStatusCode.InternalServerError)
            );

            var body = JsonConvert.SerializeObject(new
            {
                take,
                page
            });

            ApplyConfigurationField("Cms:Host", server.Url);

            // Act
            var response = await Client.PostAsync($"/api/v1.0/mediacenter/search", new StringContent(body, Encoding.UTF8, "application/json"));

            // Assert
            await response.AssertErrorResponse(ApiExceptionCodes.MediaCenterArticleError, HttpStatusCode.InternalServerError);
        }
    }
}
