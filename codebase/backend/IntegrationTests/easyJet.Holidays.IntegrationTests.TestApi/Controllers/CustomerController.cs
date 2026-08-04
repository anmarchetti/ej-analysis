using easyJet.Holidays.IntegrationTests.TestApi.Service.Customers;
using Microsoft.AspNetCore.Mvc;

namespace easyJet.Holidays.IntegrationTests.TestApi.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class CustomerController : ControllerBase
    {
        private readonly ICustomerService _customerService;

        public CustomerController(ICustomerService customerService)
        {
            _customerService = customerService;
        }

        [HttpPost]
        [Route("create-random-customer")]
        public async Task<IActionResult> CreateCustomer()
        {
            var result = await _customerService.CreateOrGetCustomer(null);

            return Ok(result);
        }
    }
}
