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
    public class HotelControllerHotelResortInfoTests : BaseComponentTest
    {
        [Trait("Api", "/api/v1.0/hotel/resort-info")]
        [Trait("Category", "Component")]
        [Theory]
        [InlineData("/api/v1.0/hotel/resort-info?code=X9424242")]
        public async Task HotelIds_CmsResponseValid_200CmsData(string query)
        {
            // Arrange
            var expectedResponse = ObjectUtils.MinifyJson(await File.ReadAllTextAsync(Path.Combine(Directory.GetCurrentDirectory(), "__admin", "files", "WebApi", "hotel_resort_info_X9424242.json")));

            // Act
            var response = await Client.GetAsync(query);
            var content = await response.Content.ReadAsStringAsync();

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            content.Should().Be(expectedResponse);
        }

        [Trait("Api", "/api/v1.0/hotel/resort-info")]
        [Trait("Category", "Component")]
        [Fact]
        public async Task HotelResortInfo_CmsNotAvailable_503WithErrorCode()
        {
            // Arrange
            var cmsServer = SpawnServer("CmsWireMockServer");
            cmsServer.Given(
                Request.Create()
                    .WithPath("/api/DestinationsSearch/GetHotelResortInfoByHotelCode")
                    .UsingGet()
            )
            .AtPriority(1)
            .RespondWith(
                Response.Create()
                    .WithStatusCode(HttpStatusCode.InternalServerError)
            );

            ApplyConfigurationField("Cms:Host", cmsServer.Url);

            var query = $"/api/v1.0/hotel/resort-info?code=AntTest";

            // Act
            var response = await Client.GetAsync(query);

            // Assert
            await response.AssertErrorResponse(ApiExceptionCodes.HotelResortInfoCodeError, HttpStatusCode.InternalServerError);
        }
    }
}

