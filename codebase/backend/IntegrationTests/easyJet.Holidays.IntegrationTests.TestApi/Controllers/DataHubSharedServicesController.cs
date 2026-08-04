using easyJet.Holidays.Api.Domain.Data.SharedServices.DataHub;
using easyJet.Holidays.IntegrationTests.TestApi.Service.DataHub;
using Microsoft.AspNetCore.Mvc;

namespace easyJet.Holidays.IntegrationTests.TestApi.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class DataHubSharedServicesController : ControllerBase
    {
        private readonly ISharedServicesDataHubService _sharedServicesBookingService;

        public DataHubSharedServicesController(ISharedServicesDataHubService sharedServicesBookingService)
        {
            _sharedServicesBookingService = sharedServicesBookingService;
        }


        [HttpPost]
        [Route("synchronize-seats")]
        public async Task<IActionResult> SynchronizeSeats([FromBody] DatahubSyncRequest request)
        {
            var result = await _sharedServicesBookingService.SynchronizeSeats(request);

            return Ok(result);
        }

        [HttpPost]
        [Route("synchronize-flights")]
        public async Task<IActionResult> SynchronizeFlights([FromBody] DatahubSyncRequest request)
        {
            var result = await _sharedServicesBookingService.SynchronizeFlights(request);

            return Ok(result);
        }
    }
}
