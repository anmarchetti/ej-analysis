using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.TradePortal.TradeAgentFeedback;
using easyJet.Holidays.Api.Domain.Services.Authentication.TradeAgent;
using easyJet.Holidays.Api.Domain.Services.Feedback;
using Microsoft.AspNetCore.Mvc;
using Asp.Versioning;
using System.Net;

namespace easyJet.Holidays.Api.Controllers.TradePortal
{
    [Route("trade-portal/feedback")]
    [ApiController]
    [ApiVersion("1.0")]
    public class TradeAgentFeedbackController : ControllerBase
    {
        private readonly ILogger<TradeAgentFeedbackController> _logger;
        private readonly ITradeAgentCookieAuthService _tradeAgentCookieService;
        private readonly ITradeAgentFeedbackService _tradeAgentFeedbackService;

        public TradeAgentFeedbackController(
            ILogger<TradeAgentFeedbackController> logger,
            ITradeAgentCookieAuthService tradeAgentCookieService,
            ITradeAgentFeedbackService feedbackService
        )
        {
            _logger = logger;
            _tradeAgentCookieService = tradeAgentCookieService;
            _tradeAgentFeedbackService = feedbackService;
        }

        /// <summary>
        /// Sends feedback, received in form, via email, uploads attached files to CloudFront
        /// </summary>
        /// <param name="feedback"></param>
        /// <response code="204">Success</response>
        /// <response code="400">Invalid field value/Required field is missing</response>
        /// <response code="403">Unauthorized. User should be authorized as a trade agent</response>
        /// <exception cref="ApiException"></exception>
        [HttpPost]
        [Route("")]
        public async Task<IActionResult> AddFeedback([FromForm] TradeAgentFeedbackRequest feedback)
        {
            try
            {
                _ = await _tradeAgentFeedbackService.Create(feedback);

                return NoContent();
            }
            catch (Exception exc)
            {
                _logger.LogError(exc.Message);
                throw new ApiException(
                    ApiExceptionCodes.FeedbackSaveError,
                    "Failed to save feedback.",
                    null, exc,
                    HttpStatusCode.InternalServerError
                );
            }
        }
    }
}
