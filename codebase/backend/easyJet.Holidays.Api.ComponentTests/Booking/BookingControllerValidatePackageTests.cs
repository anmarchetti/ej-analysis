using AutoFixture.Xunit3;
using easyJet.Holidays.Api.ComponentTests.Utils;
using System.Net;
using easyJet.Holidays.Tests.Domain.Integration;
using System.Text;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using FluentAssertions.Execution;
using easyJet.Holidays.Api.Controllers.Booking;
using Xunit;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Tests.Domain.ComponentTests;

namespace easyJet.Holidays.Api.ComponentTests.Booking
{
    /// <summary>
    /// Component tests for <see cref="BookingController"/>
    /// </summary>
    public class BookingControllerValidatePackageTests : BaseComponentTest
    {
        private const string ValidatePackageEndpointUrl = "/api/v1.0/booking/validate-package";

        [Trait("Category", "Component")]
        [Trait("Api", "/api/v1.0/booking/validate-package")]
        [Theory]
        [InlineAutoData("validate_package_TRBD0014_int_routes_request.json", "validate_package_TRBD0014_int_routes_response.json")]
        [InlineAutoData("validate_package_ESMJ0001_ext_routes_request.json", "validate_package_ESMJ0001_ext_routes_response.json")]
        [InlineAutoData("validate_package_WITHDISC_request.json", "validate_package_WITHDISC_response.json")]
        public async Task ValidatePackage_Maps(string requestPath, string expectedResponsePath)
        {
            // Arrange
            var request = await File.ReadAllTextAsync(Path.Combine(Directory.GetCurrentDirectory(), "__admin", "files", "WebApi", "validate-package", requestPath));
            var expectedResponse = ObjectUtils.MinifyJson(await File.ReadAllTextAsync(Path.Combine(Directory.GetCurrentDirectory(), "__admin", "files", "WebApi", "validate-package", expectedResponsePath)));

            // Act
            var response = await Client.PostAsync(ValidatePackageEndpointUrl, new StringContent(request, Encoding.UTF8, "application/json"));
            var content = await response.Content.ReadAsStringAsync();

            // Assert
            using (new AssertionScope())
            {
                response.StatusCode.Should().Be(HttpStatusCode.OK);
                content.Should().Be(expectedResponse);
            }
        }

        [Trait("Category", "Component")]
        [Trait("Api", "/api/v1.0/booking/validate-package")]
        [Theory]
        [InlineAutoData("validate_package_TRBD0014_int_routes_request.json", -1, HttpStatusCode.BadRequest)]
        [InlineAutoData("validate_package_TRBD0014_int_routes_request.json", 0, HttpStatusCode.BadRequest)]
        [InlineAutoData("validate_package_TRBD0014_int_routes_request.json", 1, HttpStatusCode.BadRequest)]
        [InlineAutoData("validate_package_TRBD0014_int_routes_request.json", 2, HttpStatusCode.OK)]
        public async Task ValidatePackage_DisabledOffersForNextDay_ValidatesAccomDate(string requestPath, int addDays, HttpStatusCode expectedCode)
        {
            ApplyConfigurationField("Api:DisabledOffersForNextDay", "true");

            // Arrange
            var request = await File.ReadAllTextAsync(Path.Combine(Directory.GetCurrentDirectory(), "__admin", "files", "WebApi", "validate-package", requestPath));
            request = request.Replace($"\"date\": \"2020-05-03T00:00:00\"", $"\"date\": \"{DateTimeOffset.UtcNow.AddDays(addDays).ToString("yyyy-MM-dd")}T00:00:00\"");
            //2020-13-27T00:00:00
            // Act
            var response = await Client.PostAsync(ValidatePackageEndpointUrl, new StringContent(request, Encoding.UTF8, "application/json"));

            // Assert
            response.StatusCode.Should().Be(expectedCode);
        }

        [Fact]
        public async Task ValidatePackage_VouchersDisabled_ShouldThrowException()
        {
            // Arrange
            ApplyConfigurationField("Api:Vouchers:IsActive", "false");

            var requestFilePath = "validate_package_TRBD0014_int_routes_request_something_specified_in_discount.json";
            var request = await File.ReadAllTextAsync(Path.Combine(Directory.GetCurrentDirectory(), "__admin", "files", "WebApi", "validate-package", requestFilePath));

            // Act
            var response = await Client.PostAsync(ValidatePackageEndpointUrl, new StringContent(request, Encoding.UTF8, "application/json"));

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        }


        [Trait("Category", "Component")]
        [Trait("Api", "/api/v1.0/booking/validate-package")]
        [Theory]
        [InlineAutoData("validate_package_ESMJ0001_with_transfrer_request.json", "validate_package_ESMJ0001_with_transfer_response.json")]
        [InlineAutoData("validate_package_ESMJ0001_ext_routes_request.json", "validate_package_ESMJ0001_ext_routes_response.json")]
        public async Task ValidatePackage_Tansfers(string requestPath, string expectedResponsePath)
        {
            // Arrange
            var request = await File.ReadAllTextAsync(Path.Combine(Directory.GetCurrentDirectory(), "__admin", "files", "WebApi", "validate-package", requestPath));
            var expectedResponse = ObjectUtils.MinifyJson(await File.ReadAllTextAsync(Path.Combine(Directory.GetCurrentDirectory(), "__admin", "files", "WebApi", "validate-package", expectedResponsePath)));

            // Act
            var response = await Client.PostAsync(ValidatePackageEndpointUrl, new StringContent(request, Encoding.UTF8, "application/json"));
            var content = await response.Content.ReadAsStringAsync();

            // Assert
            using (new AssertionScope())
            {
                response.StatusCode.Should().Be(HttpStatusCode.OK);
                content.Should().Be(expectedResponse);
            }
        }

        [Trait("Category", "Component")]
        [Trait("Api", "/api/v1.0/booking/validate-package")]
        [Fact]
        public async Task ValidatePackage_WithExtraLuggage_ReturnsCorrectResult()
        {
            var request = ComponentTestUtils.GetJsonString(
                @"WebApi\validate-package\luggage\validate-package-with-extra-luggage-request.json");

            var expected = ComponentTestUtils.GetJsonString(
                @"WebApi\validate-package\luggage\validate-package-with-extra-luggage-response.json", minify: true);

            var response = await Client.PostAsync(ValidatePackageEndpointUrl, ComponentTestUtils.GetJsonContent(request));

            var content = await response.Content.ReadAsStringAsync();
            content.Should().Be(expected);
        }

        [Trait("Category", "Component")]
        [Trait("Api", "/api/v1.0/booking/validate-package")]
        [Fact]
        public async Task ValidatePackage_WithSeats_ReturnsNotCachedCorrectResult()
        {
            // Arrange
            var request = ComponentTestUtils.GetJsonString(@"WebApi\validate-package\seats\validate-package-with-seats-request_no_cache.json");
            var expected = ComponentTestUtils.GetJsonString(@"WebApi\validate-package\seats\validate-package-with-seats-response_no_cache.json", true);

            // Act
            var requestContent = ComponentTestUtils.GetJsonContent(request);
            var response = await Client.PostAsync(ValidatePackageEndpointUrl, requestContent);

            // Assert
            var content = await response.Content.ReadAsStringAsync();

            content.Should().Be(expected);
        }

        [Trait("Category", "Component")]
        [Trait("Api", "/api/v1.0/booking/validate-package")]
        [Fact]
        public async Task ValidatePackage_WithSeats_ReturnsCachedCorrectResult()
        {
            // Arrange
            var request = ComponentTestUtils.GetJsonString(@"WebApi\validate-package\seats\validate-package-with-seats-request_with_cache.json");
            var expected = ComponentTestUtils.GetJsonString(@"WebApi\validate-package\seats\validate-package-with-seats-response_with_cache.json", true);

            // Act
            var requestContent = ComponentTestUtils.GetJsonContent(request);
            var response = await Client.PostAsync(ValidatePackageEndpointUrl, requestContent);

            // Assert
            var content = await response.Content.ReadAsStringAsync();

            content.Should().Be(expected);
        }

        [Trait("Category", "Component")]
        [Trait("Api", "/api/v1.0/booking/validate-package")]
        [Fact]
        public async Task ValidatePackage_WithSportEquipmentAndSharedTransfer_ReturnsSurcharge()
        {
            var request = ComponentTestUtils.GetJsonString(
                @"WebApi\validate-package\luggage\validate-package-with-sport-equipment-request.json");

            var expected = ComponentTestUtils.GetJsonString(
                @"WebApi\validate-package\luggage\validate-package-with-sport-equipment-response.json", minify: true);

            var response = await Client.PostAsync(ValidatePackageEndpointUrl, ComponentTestUtils.GetJsonContent(request));

            var content = await response.Content.ReadAsStringAsync();
            content.Should().Be(expected);
        }

        [Trait("Category", "Component")]
        [Trait("Api", "/api/v1.0/booking/validate-package")]
        [Fact]
        public async Task ValidatePackage_WithAirportParking_ReturnsValidatedAirportParkingInfoInResponse()
        {
            var request = ComponentTestUtils.GetJsonString(
                @"WebApi\validate-package\airportParking\validate-package-with-airport-parking-request.json");

            var expected = ComponentTestUtils.GetJsonString(
                @"WebApi\validate-package\airportParking\validate-package-with-airport-parking-response.json", minify: true);

            var response = await Client.PostAsync(ValidatePackageEndpointUrl, ComponentTestUtils.GetJsonContent(request));

            var content = await response.Content.ReadAsStringAsync();

            content.Should().BeEqualAfterNormalization<ValidateBookingResponse>(expected);
        }
    }
}
