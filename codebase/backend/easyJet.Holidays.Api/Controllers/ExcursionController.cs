using easyJet.Holidays.Api.Domain.Data.Excursions;
using easyJet.Holidays.Api.Domain.Interfaces.Excursions;
using Microsoft.AspNetCore.Mvc;
using Asp.Versioning;
using System.Net;

namespace easyJet.Holidays.Api.Controllers
{
    /// <summary>
    /// Excursion API Controller
    /// </summary>
    [Route("excursions")]
    [ApiController]
    [ApiVersion("1.0")]
    public class ExcursionController : ControllerBase
    {
        private readonly IExcursionService _excursionService;

        public ExcursionController(IExcursionService excursionService)
        {
            _excursionService = excursionService;
        }

        /// <summary>
        /// Get excursions based on request param
        /// </summary>
        /// <param name="request">Search parameters</param>
        /// <returns>ExcursionsResponse</returns>
        /// <response code="200"></response>
        /// <response code="400">Bad requests, parameters do no match</response>
        /// <response code="404">No excursions</response>
        /// <response code="503">Unable to search</response>
        [HttpGet]
        [Route("")]
        [ProducesResponseType(typeof(ExcursionsResponse), (int)HttpStatusCode.OK)]
        public async Task<IActionResult> Get([FromQuery] ExcursionsRequest request)
        {
            var result = await _excursionService.Search(request);
            return Ok(result);
        }
    }
}
