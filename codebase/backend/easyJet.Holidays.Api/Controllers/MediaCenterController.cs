using easyJet.Holidays.Api.Domain.Data.MediaCenter;
using easyJet.Holidays.Api.Domain.Interfaces.MediaCenter;
using Microsoft.AspNetCore.Mvc;
using Asp.Versioning;
using System.Net;

namespace easyJet.Holidays.Api.Controllers
{
    [Route("mediacenter")]
    [ApiController]
    [ApiVersion("1.0")]
    public class MediaCenterController : ControllerBase
    {
        private readonly IMediaCenterSearchService _mediaCenterSearchService;

        public MediaCenterController(
            IMediaCenterSearchService mediaCenterSearchService
        )
        {
            _mediaCenterSearchService = mediaCenterSearchService;
        }

        /// <summary>
        /// GetArticles from sitecore by request criterias.
        /// </summary>
        /// <param name="request">Model with criterias to look articles for.</param>
        /// <returns>Founded articles.</returns>
        [HttpPost]
        [Route("search")]
        [ProducesResponseType(typeof(ArticlesResponse), (int)HttpStatusCode.OK)]
        public async Task<IActionResult> GetArticles(ArticlesRequest request)
        {
            var content = await _mediaCenterSearchService.GetArticles(request);

            return Ok(content);
        }

        /// <summary>
        /// Get topics from sitecore.
        /// </summary>
        /// <returns>Available topics.</returns>
        [HttpGet]
        [Route("topics")]
        [ProducesResponseType(typeof(string[]), (int)HttpStatusCode.OK)]
        public async Task<IActionResult> GetTopics()
        {
            var content = await _mediaCenterSearchService.GetTopics();

            return Ok(content);
        }
    }
}
