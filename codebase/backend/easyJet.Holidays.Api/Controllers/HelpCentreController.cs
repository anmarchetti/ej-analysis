using easyJet.Holidays.Api.Domain.Data.DynamoDB.HelpCenter;
using easyJet.Holidays.Api.Domain.Data.HelpCenter;
using easyJet.Holidays.Api.Domain.Interfaces.HelpCenter;
using easyJet.Holidays.Api.Domain.Services.Language;
using easyJet.Holidays.Api.Domain.Services.Market;
using Microsoft.AspNetCore.Mvc;
using Asp.Versioning;
using System.Net;

namespace easyJet.Holidays.Api.Controllers
{
    [Route("help-centre")]
    [ApiController]
    [ApiVersion("1.0")]
    public class HelpCentreController : ControllerBase
    {
        private readonly IFaqService _faqService;
        private readonly IFeedbackService _feedbackService;
        private readonly IMarketService _marketService;
        private readonly ILanguageService _languageService;

        public HelpCentreController(
            IFaqService faqService,
            IFeedbackService feedbackService,
            IMarketService marketService,
            ILanguageService languageService)
        {
            _faqService = faqService;
            _feedbackService = feedbackService;
            _marketService = marketService;
            _languageService = languageService;
        }

        /// <summary>
        /// Save info
        /// </summary>
        /// <remarks>
        /// Sample requests:
        /// 
        ///     POST /help-centre/faq/save
        ///     {        
        ///       "question": "Covid-19 - before you travel",
        ///       "questionHeader": "Where can I get a Covid-19 test for my holiday?",
        ///       "wasUseful": true        
        ///     }
        /// 
        ///     POST /help-centre/faq/save
        ///     {        
        ///       "question": "Covid-19 - before you travel",
        ///       "questionHeader": "Where can I get a Covid-19 test for my holiday?",
        ///       "text": "Bla bla bla"
        ///       "wasUseful": true    
        ///     }
        /// </remarks>
        /// <param name="faqInfo"></param>
        /// <returns></returns>
        [HttpPost]
        [Route("faq/save")]
        [ProducesResponseType((int)HttpStatusCode.OK)]
        public async Task<IActionResult> Save(FaqInfo faqInfo)
        {
            faqInfo.LanguageCode = _languageService.GetCurrentLanguage();
            faqInfo.MarketCode ??= _marketService.GetCurrentMarket()?.Code;

            await _faqService.Save(faqInfo);
            return Ok();
        }

        /// <summary>
        /// Save user's feedback information
        /// </summary>
        /// <param name="feedbackInfoRequest"></param>
        /// <returns></returns>
        [HttpPost]
        [Route("feedback/save")]
        [ProducesResponseType((int)HttpStatusCode.OK)]
        public async Task<IActionResult> Save(FeedbackInfoRequest feedbackInfoRequest)
        {
            feedbackInfoRequest.LanguageCode = _languageService.GetCurrentLanguage();
            feedbackInfoRequest.MarketCode ??= _marketService.GetCurrentMarket()?.Code;

            await _feedbackService.Save(feedbackInfoRequest);
            return Ok();
        }
    }
}