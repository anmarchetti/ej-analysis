using easyJet.Holidays.Api.Domain.Data.Availability;
using easyJet.Holidays.Api.Domain.Data.Destinations;
using easyJet.Holidays.Api.Domain.Interfaces.Availability;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.AspNetCore.Mvc;
using Asp.Versioning;
using Microsoft.Extensions.Options;
using System.Net;

namespace easyJet.Holidays.Api.Controllers
{
    /// <summary>
    /// Atcom search API Controller
    /// </summary>
    [Route("availability")]
    [ApiController]
    [ApiVersion("1.0")]
    public class AvailabilityController : ControllerBase
    {
        private readonly IRouteAvailabilityService _routeAvailabilityService;
        private readonly SearchSettings _searchSettings;

        public AvailabilityController(
            IRouteAvailabilityService routeAvailabilityService,
            IOptions<SearchSettings> searchSettings)
        {
            _searchSettings = searchSettings.Value ?? throw new ArgumentNullException(nameof(searchSettings));
            _routeAvailabilityService = routeAvailabilityService;
        }

        /// <summary>
        /// Get routes availability for departure airport based on destination codes
        /// </summary>
        /// <param name="to">Destination field codes, e.g. EG,ESCD,ESIB</param>
        /// <param name="flexibleDays">Number of flexible days.</param>
        /// <param name="startDate">Start date(optional)</param>
        /// <param name="endDate">End date(optional)</param>
        /// <param name="duration">Stay duration (optional)</param>
        /// <param name="promoPageId">Promo page id (optional)</param>
        /// <response code="200">Array of available airport codes, e.g. "LGW", "MAN", "BOH"</response>
        /// <response code="503">Unexpected error</response>
        [HttpGet]
        [Route("from")]
        [ProducesResponseType(typeof(string[]), (int)HttpStatusCode.OK)]
        public async Task<IActionResult> GetAvailabilityFrom(string to, int flexibleDays, DateTime? startDate, DateTime? endDate, int? duration, string promoPageId)
        {
            if (_searchSettings.DisableRouteValidation)
            {
                return Ok(null);
            }

            var response = await _routeAvailabilityService.GetDepartureAvailability(to, flexibleDays, startDate, endDate, duration, promoPageId);

            return Ok(response);
        }

        /// <summary>
        /// Get destination codes available based on selected airports and dates
        /// </summary>
        /// <param name="from">selected airport codes, e.g. LGW,LTN,MAN</param>
        /// <param name="flexibleDays">Number of flexible days</param>
        /// <param name="startDate">Start date(optional)</param>
        /// <param name="endDate">End date(optional)</param>
        /// <param name="duration">Stay duration (optional)</param>
        /// <response code="200">Array of available destination codes, e.g. "ESMJ0002", "ESMJ0004", "X9000021"</response>
        /// <response code="503">Unexpected error</response>
        [HttpGet]
        [Route("to")]
        [ProducesResponseType(typeof(string[]), (int)HttpStatusCode.OK)]
        public async Task<IActionResult> GetAvailabilityTo(string from, int flexibleDays, DateTime? startDate, DateTime? endDate, int? duration)
        {
            if (_searchSettings.DisableRouteValidation)
            {
                return Ok(null);
            }

            var response = await _routeAvailabilityService.GetDestinationAvailability(from, flexibleDays, startDate, endDate, duration, null);

            return Ok(response?.Destinations != null
                ? response.Destinations.SelectMany(d => new[] { d.Code }.Concat(d.Type == DestinationItemType.VirtualCountry ? d.RelatedRegions : Array.Empty<string>())).ToArray()
                : Array.Empty<string>());
        }

        /// <summary>
        /// Get availability dates for routes
        /// </summary>
        /// <param name="from">Selected airport codes, e.g. LGW,LTN,MAN</param>
        /// <param name="to">Destination field codes, e.g. EG,ESCD,ESIB</param>
        /// <param name="startDate">Start date to limit time frame (optional)</param>
        /// <param name="endDate">End date to limit time frame (optional)</param>
        /// <param name="selectedFromDate">From date selected by user on calendar</param>
        /// <param name="promoPageId">Promo page id (optional)</param>
        /// <response code="200">Availability dates objects, e.g. 
        /// { "dates": [
        ///     "2020-04-04": {
        ///         "out": true,
        ///         "in": false
        ///     },
        ///     "2020-04-05": {
        ///         "out": true,
        ///         "in": true
        ///     }
        ///   ]
        /// }
        /// </response>
        /// <response code="503">Unexpected error</response>
        [HttpGet]
        [Route("dates")]
        [ProducesResponseType(typeof(DatesAvailability), (int)HttpStatusCode.OK)]
        public async Task<IActionResult> GetAvailabilityDates(string from, string to, DateTime? startDate, DateTime? endDate, DateTime? selectedFromDate, string promoPageId)
        {
            if (_searchSettings.DisableRouteValidation)
            {
                return Ok(null);
            }

            var response = await _routeAvailabilityService.GetAvailabilityDates(from, to, startDate, endDate, selectedFromDate, promoPageId);

            return Ok(response);
        }

        /// <summary>
        /// Get month availability for routes
        /// </summary>
        /// <param name="from">Selected airport codes, e.g. LGW,LTN,MAN</param>
        /// <param name="to">Destination field codes, e.g. EG,ESCD,ESIB</param>
        /// <param name="duration">Stay duration used in search</param>
        /// <returns></returns>
        [HttpGet]
        [Route("months")]
        [ProducesResponseType(typeof(MonthsAvailabilityResponse), (int)HttpStatusCode.OK)]
        public async Task<IActionResult> GetAvailabilityMonths(string from, string to, int duration)
        {
            if (_searchSettings.DisableRouteValidation)
            {
                return Ok(null);
            }

            var response = await _routeAvailabilityService.GetAvailabilityMonths(from, to, duration);

            return Ok(response);
        }

        [HttpGet]
        [Route("last-available-date")]
        [ProducesResponseType(typeof(AvailabilityDate), (int)HttpStatusCode.OK)]
        public async Task<IActionResult> GetLastAvailableDate()
        {
            if (_searchSettings.DisableRouteValidation)
            {
                return Ok(null);
            }

            var response = await _routeAvailabilityService.GetLastAvailableDate();

            return Ok(response);
        }

        /// <summary>
        /// Get whether availability exists  for specified destinations
        /// </summary>
        /// <param name="to">Destination field codes, e.g. EG,ESCD,ESIB</param>
        /// <response code="200">Object which identifies whether availability exists or not e.g.  {"ES": true, "NLAM": true, "TRAN": false}</response>
        /// <response code="503">Unexpected error</response>
        [HttpGet]
        [Route("exists")]
        [ProducesResponseType(typeof(Dictionary<string, bool>), (int)HttpStatusCode.OK)]
        public async Task<IActionResult> AvailabilityExists(string to)
        {
            if (_searchSettings.DisableRouteValidation)
            {
                return Ok(new Dictionary<string, bool>());
            }

            var response = await _routeAvailabilityService.DestinationAvailabilityExists(to);

            return Ok(response);
        }
    }
}