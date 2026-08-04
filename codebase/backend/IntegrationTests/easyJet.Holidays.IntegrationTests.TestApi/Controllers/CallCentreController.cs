using easyJet.Holiday.IntegrationTests.Shared.Models.CallCentre;
using easyJet.Holidays.IntegrationTests.TestApi.Service.CallCentre;
using Microsoft.AspNetCore.Mvc;

namespace easyJet.Holidays.IntegrationTests.TestApi.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class CallCentreController : ControllerBase
    {
        private readonly ICallCentreService _callCentreService;
        public CallCentreController(ICallCentreService callCentreService)
        {
            _callCentreService = callCentreService;
        }

        [HttpGet]
        [Route("get-credits")]
        public async Task<IActionResult> GetCredits([FromQuery] GetCreditsRequest request)
        {
            var result = await _callCentreService.GetCredits(request);

            return Ok(result);
        }

        [HttpPost]
        [Route("add-credits")]
        public async Task<IActionResult> AddCredits([FromBody] AddCreditsRequest request)
        {
            var result = await _callCentreService.AddCredits(request);

            return Ok(result);
        }
        
        // [HttpPost]
        // [Route("add-spend")]
        // public async Task<IActionResult> SpendCredits([FromBody] SpendCreditRequest request)
        // {
        //     var result = await _callCentreService.AddCredits(request);
        //
        //     return Ok(result);
        // }
    }
}
