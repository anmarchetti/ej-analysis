using easyJet.Holidays.Api.Domain.Constants;
using easyJet.Holidays.Api.Domain.Data.Seats;
using easyJet.Holidays.Api.Domain.Interfaces.Seats;
using easyJet.Holidays.Api.Domain.Services.Market;
using Microsoft.AspNetCore.Mvc;
using Asp.Versioning;
using System.Net;

namespace easyJet.Holidays.Api.Controllers
{
    [Route("seats")]
    [ApiController]
    [ApiVersion("1.0")]
    public class SeatsController(ISeatingService seatsService, IMarketService marketService) : ControllerBase
    {
        /// <summary>
        /// GetSeatsMap by query params
        /// </summary>
        /// <param name="searchRequest">Search parameters</param>
        /// <returns>>GetSeatsMap results</returns>
        /// <response code="200">GetSeatsMap results</response>
        /// <response code="400">Bad requests, parameters do no match</response>
        /// <response code="503">Unable to search</response>
        [HttpGet]
        [Route("")]
        [ProducesResponseType(typeof(GetSeatsMapResponse), (int)HttpStatusCode.OK)]
        public async Task<IActionResult> GetSeatsMap([FromQuery] GetSeatsMapRequest searchRequest)
        {
            if (searchRequest == null)
            {
                return null;
            }

            searchRequest.Child ??= B2BConstants.No;
            searchRequest.Disability ??= B2BConstants.No;
            searchRequest.HaseEjPlusCard ??= B2BConstants.No;
            searchRequest.InfantOnLap ??= B2BConstants.No;
            searchRequest.PhysicalDisorder ??= B2BConstants.No;
            searchRequest.Pregnant ??= B2BConstants.No;
            searchRequest.CurrencyCode ??= marketService.GetCurrentMarket().Currency.Code;
            var response = await seatsService.GetSeatsMap(searchRequest, true);

            return Ok(response);
        }
    }
}
