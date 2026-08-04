using easyJet.Holidays.Api.Domain.Data.SharedServices.DataHub;
using easyJet.Holidays.Api.Filters;
using easyJet.Holidays.External.DataHub.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Asp.Versioning;
using System.Net;

namespace easyJet.Holidays.Api.Controllers.SharedServices
{
    /// <summary>
    /// DataHubSharedServicesController
    /// </summary>
    [Route("shared-services/datahub")]
    [ApiVersion("1.0")]
    [ServiceFilter(typeof(DisableValidationAttribute))]
    [ServiceFilter(typeof(UseSerializerWithFullConverterForOutputAttribute))]
    [ServiceFilter(typeof(SharedServicesAuthorizedAttribute))]
    public class DataHubSharedServicesController : ControllerBase
    {
        private readonly IDataHubService _dataHubService;

        /// <summary>
        /// ctor
        /// </summary>
        /// <param name="dataHubService"></param>
        public DataHubSharedServicesController(IDataHubService dataHubService)
        {
            _dataHubService = dataHubService;
        }

        /// <summary>
        /// Synchronize seats
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost]
        [Route($"synchronize-seats")]
        [ProducesResponseType(typeof(DatahubSyncResponse), (int)HttpStatusCode.OK)]
        public async Task<IActionResult> SynchronizeSeats([FromBody] DatahubSyncRequest request)
        {
            var result = await _dataHubService.SynchronizeSeats(request);

            return new OkObjectResult(result);
        }

        /// <summary>
        /// SynchronizeFlightPnr
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost]
        [Route($"synchronize-flights")]
        [ProducesResponseType(typeof(DatahubSyncResponse), (int)HttpStatusCode.OK)]
        public async Task<IActionResult> SynchronizeFlights([FromBody] DatahubSyncRequest request)
        {
            var result = await _dataHubService.SynchronizeFlights(request);

            return new OkObjectResult(result);
        }

        /// <summary>
        /// SynchronizeBagsPnr
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost]
        [Route($"synchronize-bags")]
        [ProducesResponseType(typeof(DatahubSyncResponse), (int)HttpStatusCode.OK)]
        public async Task<IActionResult> SynchronizeBags([FromBody] DatahubSyncRequest request)
        {
            var result = await _dataHubService.SynchronizeBags(request);

            return new OkObjectResult(result);
        } 
    }
}