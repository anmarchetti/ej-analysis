using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Controllers;
using easyJet.Holidays.Tests.Domain;
using easyJet.Holidays.Tests.Domain.ComponentTests;
using FluentAssertions;
using System.Net;
using WireMock.RequestBuilders;
using WireMock.ResponseBuilders;
using Xunit;

namespace easyJet.Holidays.Api.ComponentTests.Hotel
{
    /// <summary>
    /// Component tests for <see cref="HotelController"/>
    /// </summary>
    public class HotelControllerHotelsIdsTests : BaseComponentTest
    {
        [Trait("Api", "/api/v1.0/hotel/codes")]
        [Trait("Category", "Component")]
        [Theory]
        [InlineData("/api/v1.0/hotel/codes?take=2")]
        [InlineData("/api/v1.0/hotel/codes?take=2&page=1")]
        [InlineData("/api/v1.0/hotel/codes?take=2&page=0&lastupdated=2020-03-03T03:00:00.0000000")]
        public async Task HotelIds_CmsResponseValid_200CmsData(string query)
        {
            // Arrange
            var expectedResponse = ObjectUtils.MinifyJson(await File.ReadAllTextAsync(Path.Combine(Directory.GetCurrentDirectory(), "__admin", "files", "WebApi", "hotel_ids.json")));

            // Act
            var response = await Client.GetAsync(query);
            var content = await response.Content.ReadAsStringAsync();

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            content.Should().Be(expectedResponse);
        }

        [Trait("Api", "/api/v1.0/hotel/codes")]
        [Trait("Category", "Component")]
        [Fact]
        public async Task HotelIds_CmsNotAvailable_503WithErrorCode()
        {
            // Arrange
            var server = SpawnServer("CmsWireMockServer");
            server.Given(
                Request.Create()
                    .WithPath("/api/DestinationsSearch/GetHotelsCodes")
                    .UsingGet()
            )
            .AtPriority(1)
            .RespondWith(
                Response.Create()
                    .WithStatusCode(HttpStatusCode.InternalServerError)
            );

            ApplyConfigurationField("Cms:Host", server.Url);

            var query = $"/api/v1.0/hotel/codes?take=2&page=0&lastupdated=";

            // Act
            var response = await Client.GetAsync(query);

            // Assert
            await response.AssertErrorResponse(ApiExceptionCodes.HotelsCodesSearchError, HttpStatusCode.InternalServerError);
        }
    }
}

