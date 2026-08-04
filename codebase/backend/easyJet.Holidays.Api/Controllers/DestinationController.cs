using easyJet.Holidays.Api.Domain.Data.Destinations;
using easyJet.Holidays.Api.Domain.Interfaces.Availability;
using easyJet.Holidays.Api.Domain.Interfaces.Destinations;
using easyJet.Holidays.Api.Domain.Interfaces.MissedSearches;
using easyJet.Holidays.Api.Domain.Services.Language;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Services.ReferenceData.Destinations;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.AspNetCore.Mvc;
using Asp.Versioning;
using Microsoft.Extensions.Options;
using System.ComponentModel.DataAnnotations;
using System.Net;

namespace easyJet.Holidays.Api.Controllers
{
    /// <summary>
    /// Destinations reference data controller
    /// </summary>
    [Route("destinations")]
    [ApiController]
    [ApiVersion("1.0")]
    public class DestinationController : ControllerBase
    {
        private readonly IDestinationsService _destinationsService;
        private readonly IReferenceDataService _referenceDataService;
        private readonly IDestinationTitlesService _destinationTitlesService;
        private readonly SearchSettings _searchSettings;
        private readonly IRouteAvailabilityService _routeAvailabilityService;
        private readonly ILanguageService _languageService;
        private readonly IMissedSearchesService _missedSearchesService;

        public DestinationController(
            IDestinationsService destinationsService,
            IDestinationTitlesService destinationTitlesService,
            IOptions<SearchSettings> searchSettings,
            IRouteAvailabilityService routeAvailabilityService,
            IReferenceDataService referenceDataService,
            ILanguageService languageService,
            IMissedSearchesService missedSearchesService)
        {
            _searchSettings = searchSettings.Value ?? throw new ArgumentNullException(nameof(searchSettings));
            _destinationsService = destinationsService;
            _destinationTitlesService = destinationTitlesService;
            _routeAvailabilityService = routeAvailabilityService;
            _referenceDataService = referenceDataService;
            _languageService = languageService;
            _missedSearchesService = missedSearchesService;
        }

        /// <summary>
        /// Search destinations by query and type.
        /// type is bit flag:
        ///     All = 0,
        ///     Country = 1,
        ///     Region = 2,
        ///     Resort = 4,
        ///     Accommodation = 8,
        ///     VirtualCountry = 16,
        ///     VirtualRegion = 32
        /// </summary>
        /// <param name="query">Search query</param>
        /// <param name="destination">Destination types</param>
        /// <returns></returns>
        [HttpGet]
        [Route("")]
        [ProducesResponseType(typeof(DestinationsSearchResponse), (int)HttpStatusCode.OK)]
        public async Task<IActionResult> Search(string query, DestinationFilter destination = DestinationFilter.All)
        {
            if (string.IsNullOrEmpty(query) || query.Trim().Length < _searchSettings.DestinationsMinCharacters)
            {
                return BadRequest($"Search query must contain at least {_searchSettings.DestinationsMinCharacters} characters");
            }

            var response = await _destinationsService.Search(query, destination);
            return Ok(response);
        }

        /// <summary>
        /// Get location image by code (e.g. ESMJ)
        /// </summary>
        /// <param name="code">Location code e.g. ESMJ</param>
        /// <returns>Location image</returns>
        /// <response code="200">Location image</response>
        /// <response code="503">Internal server error to search</response>
        [HttpGet]
        [Route("{code}/image")]
        [ProducesResponseType(typeof(string), (int)HttpStatusCode.OK)]
        public async Task<IActionResult> Image([Required] string code)
        {
            var image = await _destinationsService.GetImage(code);
            return Ok(image);
        }

        /// <summary>
        /// Typeahead destinations search. Returns country+region tree, resorts and locations
        /// </summary>
        /// <param name="query">Search query. Must contain more than 2 characters</param>
        /// <param name="from">Optional value of "From" field</param>
        /// <param name="flexibleDays">Number of flexible days</param>
        /// <param name="startDate">Optional begin of displayed range in calendar</param>
        /// <param name="endDate">Optional end of displayed range in calendar</param>
        /// <param name="duration">Optional stay duration</param>
        /// <returns>Offers list</returns>
        /// <response code="200">Destinations tree</response>
        /// <response code="400">Search query contains less than 3 characters</response>
        /// <response code="503">Unable to get destinations</response>
        [HttpGet]
        [Route("search")]
        [ProducesResponseType(typeof(DestinationsSearchResponse), (int)HttpStatusCode.OK)]
        public async Task<IActionResult> Search(string query, string from, int flexibleDays, DateTime? startDate, DateTime? endDate, int? duration)
        {
            if (string.IsNullOrEmpty(query) || query.Trim().Length < _searchSettings.DestinationsMinCharacters)
            {
                return BadRequest($"Search query must contain at least {_searchSettings.DestinationsMinCharacters} characters");
            }

            DestinationsSearchResponse response;

            if (!_searchSettings.DisableRouteValidation)
            {
                response = await _routeAvailabilityService.GetDestinationAvailability(from, flexibleDays, startDate, endDate, duration, query);
            }
            else
            {
                response = await _destinationsService.Search(query, DestinationFilter.All);
            }

            if (_searchSettings.StoreMissedSearches && response.Destinations.Count == 0)
            {
                await _missedSearchesService.Save(query, from, flexibleDays, startDate, endDate);
            }

            return Ok(response);
        }

        /// <summary>
        /// Add destinations(country and region) search
        /// </summary>
        /// <returns>Country/region tree</returns>
        /// <response code="200">Destinations tree(country and region)</response>
        /// <response code="503">Unable to get destinations</response>
        [HttpGet]
        [Route("countries")]
        [ProducesResponseType(typeof(DestinationsSearchResponse), (int)HttpStatusCode.OK)]
        public async Task<IActionResult> Countries()
        {
            var destinations = await _referenceDataService.GetAllDestinations(true);
            if (destinations == null)
            {
                return Ok(destinations);
            }

            var response = new DestinationsSearchResponse
            {
                Destinations = destinations
            };

            // Remove countries which have ShowOnSearchPod=false
            response.Destinations = response.Destinations ?? new List<DestinationItem>();
            response.Destinations.ForEach(d =>
            {
                if (d.Type != DestinationItemType.VirtualCountry)
                {
                    // Top items definitely won't have any parents. And we don't want to return "parents": [] (save some bytes)
                    // and they are available by default
                    d.Parents = null;
                }
                d.Available = true;

                // Also remove children with ShowOnSearchPod=false
                d.Children = d.Children?.Where(c => c.ShowOnSearchPod).ToList();
            });

            return Ok(response);
        }

        /// <summary>
        /// Add destinations(country and region) search
        /// </summary>
        /// <returns>Country/region tree</returns>
        /// <response code="200">Destinations tree(country and region)</response>
        /// <response code="503">Unable to get destinations</response>
        [HttpPost]
        [Route("title")]
        [ProducesResponseType(typeof(DestinationItem[]), (int)HttpStatusCode.OK)]
        public async Task<IActionResult> Titles(GetTitlesRequest request)
        {
            var response = await _destinationTitlesService.GetTitles(request.Codes, _languageService.GetCurrentLanguage());
            return Ok(response);
        }

        /// <summary>
        /// Performs mapping between old-style destinations from.com site and new Holidays destination
        /// </summary>
        /// <param name="query">Search query. Must contain more than 2 characters</param>
        /// <returns>list of destination codes</returns>
        /// <response code="200">Destinations codes list</response>
        [HttpGet]
        [Route("map")]
        [ProducesResponseType(typeof(DestinationsMappingResponse), (int)HttpStatusCode.OK)]
        public async Task<IActionResult> Map(string query)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return Ok();
            }

            var response = await _destinationsService.Map(query);

            return Ok(response);
        }


        /// <summary>
        /// Get destination code by destination name.
        /// </summary>
        /// <param name="name">Destination name.</param>
        /// <returns>Destination code.</returns>
        /// <response code="200">Destination code.</response>
        [HttpGet]
        [Route("{name}/code")]
        [ProducesResponseType(typeof(string), (int)HttpStatusCode.OK)]
        public async Task<IActionResult> GetDestinationCodeByName(string name)
        {
            var response = await _destinationsService.GetDestinationCodeByName(name);

            return Ok(response);
        }

        /// <summary>
        /// Get destuination info.
        /// </summary>
        /// <param name="codes">Codes to search</param>
        /// <param name="includeRelatedItems">If true will include destination parrents</param>
        /// <returns></returns>
        [HttpPost]
        [Route("search")]
        [ProducesResponseType(typeof(DestinationItem[]), (int)HttpStatusCode.OK)]
        public async Task<IActionResult> GetDestinationsByCodes([FromBody] string[] codes, [FromQuery] bool includeRelatedItems = false)
        {
            var response = await _destinationsService.GetDestinationsByCodes(codes, includeRelatedItems);
            return Ok(response);
        }
    }
}