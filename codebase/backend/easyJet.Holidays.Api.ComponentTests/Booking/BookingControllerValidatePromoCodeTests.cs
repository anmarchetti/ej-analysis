using AutoFixture.Xunit3;
using System.Net;
using System.Text;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using FluentAssertions.Execution;
using easyJet.Holidays.Api.Controllers.Booking;
using easyJet.Holidays.Tests.Domain.ComponentTests;
using Xunit;

namespace easyJet.Holidays.Api.ComponentTests.Booking
{
    /// <summary>
    /// Component tests for <see cref="BookingController.ValidatePromoCode"/>
    /// </summary>
    public class BookingControllerValidatePromoCodeTests : BaseComponentTest
    {
        private const string ValidatePromoCodeEndpointUrl = "/api/v1.0/booking/validate-promo-code";

        [Trait("Category", "Component")]
        [Trait("Api", "/api/v1.0/booking/validate-promo-code")]
        [Theory]
        [InlineAutoData("validate_promo_code_success_request.json", "validate_promo_code_success_response.json")]
        public async Task ValidatePromoCode_WithValidCode_ReturnsSuccess(string requestPath, string expectedResponsePath)
        {
            // Arrange
            var request = await File.ReadAllTextAsync(Path.Combine(Directory.GetCurrentDirectory(), "__admin", "files", "WebApi", "validate-promo-code", requestPath));
            var expectedResponse = ObjectUtils.MinifyJson(await File.ReadAllTextAsync(Path.Combine(Directory.GetCurrentDirectory(), "__admin", "files", "WebApi", "validate-promo-code", expectedResponsePath)));

            // Act
            var response = await Client.PostAsync(ValidatePromoCodeEndpointUrl, new StringContent(request, Encoding.UTF8, "application/json"));
            var content = await response.Content.ReadAsStringAsync();

            // Assert
            using (new AssertionScope())
            {
                response.StatusCode.Should().Be(HttpStatusCode.OK);
                content.Should().Be(expectedResponse);
            }
        }

        [Trait("Category", "Component")]
        [Trait("Api", "/api/v1.0/booking/validate-promo-code")]
        [Fact]
        public async Task ValidatePromoCode_VouchersDisabled_ShouldReturnBadRequest()
        {
            // Arrange
            ApplyConfigurationField("Api:Vouchers:IsActive", "false");

            var requestFilePath = "validate_promo_code_with_discount_request.json";
            var request = await File.ReadAllTextAsync(Path.Combine(Directory.GetCurrentDirectory(), "__admin", "files", "WebApi", "validate-promo-code", requestFilePath));

            // Act
            var response = await Client.PostAsync(ValidatePromoCodeEndpointUrl, new StringContent(request, Encoding.UTF8, "application/json"));

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        }


    }
}
