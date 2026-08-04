using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Controllers;
using easyJet.Holidays.Tests.Domain.ComponentTests;
using System.Net;
using Xunit;

namespace easyJet.Holidays.Api.ComponentTests.Voucher
{
    /// <summary>
    /// Component tests for <see cref="VoucherController"/>
    /// </summary>
    public class VoucherControllerTests : BaseComponentTest
    {
        [Trait("Category", "Component")]
        [Trait("Api", "/api/v1.0/voucher/validate")]
        [Theory]
        [InlineData("validcode", true)]
        [InlineData("valid_code", true)]
        [InlineData("valid-code", true)]
        [InlineData("validcode123", true)]
        [InlineData("invalid-code-@", false)]
        [InlineData("invalid-code-$", false)]
        [InlineData("invalid-code-()", false)]
        [InlineData("", false)]
        [InlineData(null, false)]
        public async Task Validate_CodeFormat(string voucherCode, bool valid)
        {
            // Disable vouchers to stop processing. We test only code validation here
            ApplyConfigurationField("Api:Vouchers:IsActive", "false");

            var message = new HttpRequestMessage(HttpMethod.Get, $"/api/v1.0/voucher/validate?voucherCode={voucherCode}");

            // Act            
            var response = await Client.SendAsync(message);

            // Assert
            if (valid)
            {
                // we disabled vouchers. Even if code is valid we'll get error
                await response.AssertErrorResponse(ApiExceptionCodes.VouchersDisabled, HttpStatusCode.InternalServerError);
            }
            else
            {
                await response.AssertErrorResponse(ApiExceptionCodes.InvalidModelState, HttpStatusCode.BadRequest);
            }
        }
    }
}
