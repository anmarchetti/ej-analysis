using easyJet.Holidays.Api.Domain.Data.Feefo;
using easyJet.Holidays.External.Feefo.Interfaces;
using easyJet.Holidays.External.Feefo.Models.DTO;
using Microsoft.AspNetCore.Mvc;
using Asp.Versioning;
using System.Net;

namespace easyJet.Holidays.Api.Controllers
{
    [Route("reviews")]
    [ApiController]
    [ApiVersion("1.0")]
    public class ReviewsController : Controller
    {
        private readonly IFeefoService _feefoService;

        public ReviewsController(IFeefoService feefoService)
        {
            _feefoService = feefoService;
        }

        /// <summary>
        /// Get Ratings From Feefo
        /// </summary>
        /// <returns></returns>
        /// <response code="200">Ok</response>
        /// <response code="503">Internal server error</response>
        [HttpGet]
        [ProducesResponseType(typeof(ReviewsAndSummary), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        public async Task<IActionResult> GetFeefoReviews([FromQuery] FeefoReviewsSearchRequest searchRequest)
        {
            var summary = await _feefoService.GetServiceReviewsAndSummary(searchRequest);
            return Ok(summary);
        }
    }
}
