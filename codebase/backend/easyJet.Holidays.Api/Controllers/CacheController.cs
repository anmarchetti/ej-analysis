using easyJet.Holidays.Api.Domain.Services.Cache;
using easyJet.Holidays.Api.Filters;
using Microsoft.AspNetCore.Mvc;
using Asp.Versioning;
using System.ComponentModel.DataAnnotations;
using System.Net;

namespace easyJet.Holidays.Api.Controllers
{
    /// <summary>
    /// Interactions with cache
    /// </summary>
    [Route("cache")]
    [ApiController]
    [ApiVersion("1.0")]
    public class CacheController : ControllerBase
    {
        private readonly ICacheService _cacheService;

        /// <summary>
        /// .ctor
        /// </summary>
        /// <param name="cacheService"></param>
        public CacheController(
            ICacheService cacheService)
        {
            _cacheService = cacheService;
        }

        /// <summary>
        /// Get cache dump from given bucket
        /// </summary>
        /// <param name="bucket">cache bucket name</param>
        /// <response code="200">All objects in the cache bucket along with their keys</response>
        /// <response code="400">Bad request, invalid parameter values</response>
        /// <response code="401">Authorization header is missing or invalid</response>
        [HttpGet]
        [ProducesResponseType((int)HttpStatusCode.OK)]
        [ServiceFilter(typeof(ApiAuthAttribute))]
        public async Task<IActionResult> Get([FromQuery][Required] string bucket)
        {
            var bucketValues = await _cacheService.GetAllValuesForBucket(bucket);

            return Ok(bucketValues);
        }

        /// <summary>
        /// Clears cache from given bucket
        /// </summary>
        /// <param name="bucket">cache bucket name</param>
        /// <response code="200">Success</response>
        /// <response code="401">Authorization header is missing or invalid</response>
        [HttpGet]
        [Route("clear")]
        [ProducesResponseType((int)HttpStatusCode.OK)]
        [ServiceFilter(typeof(ApiAuthAttribute))]
        public async Task<IActionResult> Login(string bucket)
        {
            await _cacheService.RemoveAsync(bucket);

            return Ok();
        }
    }
}