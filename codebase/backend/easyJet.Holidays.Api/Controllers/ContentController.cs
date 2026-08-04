using easyJet.Holidays.Api.Domain.Data.Destinations;
using easyJet.Holidays.Api.Domain.Data.Hotels;
using easyJet.Holidays.Api.Domain.Data.Hotels.Facilities;
using easyJet.Holidays.Api.Domain.Data.ReferenceData;
using easyJet.Holidays.Api.Domain.Data.Transfers;
using easyJet.Holidays.Api.Domain.Interfaces.Destinations;
using easyJet.Holidays.Api.Domain.Interfaces.Hotels;
using easyJet.Holidays.Api.Domain.Services.Content;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Services.Transfers;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.AspNetCore.Mvc;
using Asp.Versioning;
using Microsoft.Extensions.Options;
using System.ComponentModel.DataAnnotations;
using System.Diagnostics.CodeAnalysis;
using System.Net;

namespace easyJet.Holidays.Api.Controllers
{
    /// <summary>
    /// Atcom search API Controller
    /// </summary>
    [Route("content")]
    [ApiController]
    [ApiVersion("1.0")]
    [SuppressMessage("Major Code Smell", "S6960:Controllers should not have mixed responsibilities", Justification = "Characteristics of the content controller")]
    public class ContentController(
        IHotelsService hotelsService,
        IReferenceDataService referenceDataService,
        ITransferService transfersService,
        IDestinationsService destinationsService,
        ICmsContentService cmsContentService,
        IOptions<LanguageSettings> languageSettings) : ControllerBase
    {
        private readonly IHotelsService _hotelsService = hotelsService;
        private readonly IReferenceDataService _referenceDataService = referenceDataService;
        private readonly ITransferService _transfersService = transfersService;
        private readonly IDestinationsService _destinationsService = destinationsService;
        private readonly ICmsContentService _cmsContentService = cmsContentService;
        private readonly LanguageSettings _languageSettings = languageSettings.Value ?? throw new ArgumentNullException(nameof(languageSettings));

        /// <summary>
        /// Get hotel details by code
        /// </summary>
        /// <param name="code">Hotel code</param>
        /// <param name="room">Additional room code to search</param>
        /// <param name="board">Additional board to search</param>
        /// <returns>Hotel details</returns>
        /// <response code="200">Hotel details</response>
        /// <response code="400">Bad requests, parameters do no match</response>
        /// <response code="503">Error</response>
        [HttpGet]
        [Route("hotels/{code}")]
        [ProducesResponseType(typeof(Hotel), (int)HttpStatusCode.OK)]
        public async Task<IActionResult> Hotel([Required] string code, [FromQuery] string room, [FromQuery] string board)
        {
            var hotel = await _hotelsService.SearchWithRoomsAndBoards(code, room, board);
            return Ok(hotel);
        }


        /// <summary>
        /// Get all countries
        /// </summary>
        /// <returns>Hotel details</returns>
        /// <response code="200">Countries</response>
        /// <response code="503">Error</response>
        [HttpGet]
        [Route("countries")]
        [ProducesResponseType(typeof(List<Domain.Data.ReferenceData.Country>), (int)HttpStatusCode.OK)]
        public async Task<IActionResult> Countries()
        {
            var countries = await _referenceDataService.GetCountries();
            return Ok(countries ?? new List<Domain.Data.ReferenceData.Country>());
        }

        /// <summary>
        /// Get all dialing codes
        /// </summary>
        /// <returns>Dialing codes</returns>
        /// <response code="200">Dialing Codes</response>
        /// <response code="503">Error</response>
        [HttpGet]
        [Route("dialing-codes")]
        [ProducesResponseType(typeof(List<DialingCode>), (int)HttpStatusCode.OK)]
        public async Task<IActionResult> DialingCodes()
        {
            var countries = await _referenceDataService.GetDialingCodes();
            return Ok(countries ?? new List<DialingCode>());
        }

        /// <summary>
        /// Get collection of facilities available for filtering
        /// </summary>
        /// <returns>Facilities</returns>
        /// <response code="200">Facilities</response>
        /// <response code="503">Error</response>
        [HttpGet]
        [Route("filter-facilities")]
        [ProducesResponseType(typeof(List<BaseFacility>), (int)HttpStatusCode.OK)]
        public async Task<IActionResult> Facilities()
        {
            var facilities = (await _referenceDataService.GetFilterFacilities()) ?? new List<FilteredFacility>();
            return Ok(facilities);
        }

        /// <summary>
        /// Get Information for map icons and other stuff
        /// </summary>
        /// <response code="200">Dictionary with values, read from Sitecore</response>
        [HttpGet]
        [Route("maps-info")]
        [ProducesResponseType(typeof(Dictionary<string, string>), (int)HttpStatusCode.OK)]
        public async Task<IActionResult> MapsInfo()
        {
            var fields = await _referenceDataService.GetMapsInfo();
            return Ok(fields ?? new Dictionary<string, string>());
        }

        /// <summary>
        /// Get transfer content
        /// </summary>
        /// <param name="transferCode">Transfer code</param>
        /// <param name="depDate">Booking departure date</param>
        /// <param name="airportCode">Arrival airport code(transfer airport)</param>
        /// <param name="accomm">Accommodation code</param>
        /// <returns>Transfer content html</returns>
        /// <response code="200">Transfer content</response>
        /// <response code="503">Error</response>
        [HttpGet]
        [Route("transfer-content")]
        [ProducesResponseType(typeof(List<BaseFacility>), (int)HttpStatusCode.OK)]
        public async Task<IActionResult> TransferContent([Required] string transferCode, [Required] DateTimeOffset depDate, [Required] string airportCode, [Required] string accomm)
        {
            var content = await _transfersService.GetContent(transferCode, depDate, airportCode, accomm);
            return Ok(content);
        }

        /// <summary>
        /// Get transfer instructions by product id
        /// </summary>
        /// <param name="productId">Product id</param>
        /// <returns>Transfer instructions object</returns>
        /// <response code="200">Transfer instructions</response>
        /// <response code="503">Error</response>
        [HttpGet]
        [Route("transfer-instructions")]
        [ProducesResponseType(typeof(TransferInfo), (int)HttpStatusCode.OK)]
        public async Task<IActionResult> TransferInstructions([Required] string productId, string lang)
        {
            lang ??= _languageSettings.DefaultLanguage;

            var content = await _transfersService.GetTransferInfoByProductId(productId, lang);
            return Ok(content);
        }

        /// <summary>
        /// Get destination item by code
        /// </summary>
        /// <param name="code"></param>
        /// <returns></returns>
        [HttpGet]
        [Route("destination/{code}")]
        [ProducesResponseType(typeof(DestinationItemData), (int)HttpStatusCode.OK)]
        public async Task<IActionResult> GetDestinationByCode([Required] string code)
        {
            var response = await _destinationsService.GetDestinationsByCodes([code], false);
            if (response == null || response.Length == 0)
            {
                return NotFound();
            }
            var destinationItemData = new DestinationItemData(response[0]);
            destinationItemData.ImageUrl = await _destinationsService.GetImage(code);

            return Ok(destinationItemData);
        }

        /// <summary>
        /// Get all destinations' codes with "Something different" tag
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        [Route("something-different-destinations")]
        [ProducesResponseType(typeof(IEnumerable<string>), (int)HttpStatusCode.OK)]
        public async Task<IActionResult> GetSomethingDifferentDestinations()
        {
            var response = await _cmsContentService.GetSomethingDifferentDestinationsCodes();
            return Ok(response);
        }
    }
}