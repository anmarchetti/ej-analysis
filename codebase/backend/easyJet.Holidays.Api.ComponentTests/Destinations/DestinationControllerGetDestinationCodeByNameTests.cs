using AutoFixture.Xunit3;
using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Controllers;
using easyJet.Holidays.Tests.Domain.ComponentTests;
using FluentAssertions;
using System.Net;
using WireMock.RequestBuilders;
using WireMock.ResponseBuilders;
using Xunit;

namespace easyJet.Holidays.Api.ComponentTests.Destinations
{
    /// <summary>
    /// Component tests for <see cref="DestinationController"/>
    /// </summary>
    public class DestinationControllerGetDestinationCodeByNameTests : BaseComponentTest
    {
        [Trait("Category", "Component")]
        [Trait("Api", "/api/v1.0/destinations/{name}/code")]
        [Theory]
        [InlineAutoData("api/v1.0/destinations/Dubrovnik/code", "HRDB")]
        public async Task DestinationCodeByName_ReturnCmsResult(string query, string expectedResponse)
        {
            // Act
            var response = await Client.GetAsync(query);
            var content = await response.Content.ReadAsStringAsync();

            // Assert
            content.Should().Be(expectedResponse);
        }


        [Trait("Category", "Component")]
        [Trait("Api", "/api/v1.0/destinations/{name}/code")]
        [Theory]
        [InlineData("api/v1.0/destinations/Dubrovnik/code")]
        public async Task DestinationCodeByName_CMSError_500WithError(string query)
        {
            // Arrange
            var cmsServer = SpawnServer("CmsWireMockServer");
            cmsServer.Given(
               Request.Create()
                   .WithPath("/api/DestinationsSearch/GetDestinationCodeByName")
                   .UsingGet()
           )
            .AtPriority(0)
            .RespondWith(
               Response.Create()
                   .WithStatusCode(HttpStatusCode.InternalServerError)
            );

            ApplyConfigurationField("Cms:Host", cmsServer.Url);

            // Act
            var response = await Client.GetAsync(query);

            // Assert
            await response.AssertErrorResponse(ApiExceptionCodes.DestinationsCodeError, HttpStatusCode.InternalServerError);
        }
    }
}
