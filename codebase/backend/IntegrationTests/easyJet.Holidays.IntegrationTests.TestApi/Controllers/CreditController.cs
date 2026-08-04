using easyJet.Holiday.IntegrationTests.Shared.Models.Customers;
using easyJet.Holidays.Api.Domain.Data.SharedServices.Vouchers;
using easyJet.Holidays.IntegrationTests.TestApi.Service.Booking;
using easyJet.Holidays.IntegrationTests.TestApi.Service.Credit;
using Microsoft.AspNetCore.Mvc;

namespace easyJet.Holidays.IntegrationTests.TestApi.Controllers;

[ApiController]
[Route("[controller]")]
public class CreditController(
    ICreditService creditService,
    ISharedServicesVouchersService sharedServicesVouchersService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetCredits([FromQuery] CustomerCredentials customerCredentials)
    {
        try
        {
            var credits = await creditService.GetCustomerCreditInfo(customerCredentials);

            return Ok(credits);
        }
        catch
        {
            return Problem();
        }
    }

    [HttpGet]
    [Route("user-history")]
    public async Task<IActionResult> GetHistory([FromQuery] CustomerCredentials customerCredentials)
    {
        try
        {
            var creditHistory = await creditService.GetCustomerCreditHistory(customerCredentials);

            return Ok(creditHistory);
        }
        catch
        {
            return Problem();
        }
    }

    [HttpGet]
    [Route("hierarchy")]
    public async Task<IActionResult> GetCreditHierarchy([FromQuery] CustomerCredentials customerCredentials,
        string currency)
    {
        try
        {
            var creditHistory = await creditService.GetCustomerCreditHierarchy(customerCredentials, currency);

            return Ok(creditHistory);
        }
        catch
        {
            return Problem();
        }
    }

    [HttpPost]
    public async Task<IActionResult> AddCredit(CreateAndPublishVoucherRequest request)
    {
        try
        {
            var voucherId = await sharedServicesVouchersService.CreateAndPublishVoucher(request);

            return Ok(voucherId);
        }
        catch
        {
            return Problem();
        }
    }
}