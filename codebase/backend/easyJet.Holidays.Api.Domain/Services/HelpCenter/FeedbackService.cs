using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.DynamoDB.HelpCenter;
using easyJet.Holidays.Api.Domain.Data.HelpCenter;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Interfaces.HelpCenter;
using easyJet.Holidays.Api.Domain.Interfaces.Repositories;
using easyJet.Holidays.Api.Domain.Interfaces.Validators;
using easyJet.Holidays.Api.Domain.Services.Authentication.TradeAgent;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Api.Domain.Validators;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;

namespace easyJet.Holidays.Api.Domain.Services.HelpCenter
{
    /// <inheritdoc />
    public class FeedbackService : IFeedbackService
    {
        private readonly IAWSDbRepository<FeedbackInfo> _repository;
        private readonly ILogger<FeedbackService> _logger;
        private readonly ITradeAgentAuthenticationService _tradeAgentAuthService;
        private readonly BookingFeedbackSettings _bookingFeedbackSettings;

        /// <summary>
        /// Feedback service ctor
        /// </summary>
        /// <param name="repository"></param>
        /// <param name="logger"></param>
        /// <param name="tradeAgentAuthService"></param>
        /// <param name="apiOptions"></param>
        public FeedbackService(
            IAWSDbRepository<FeedbackInfo> repository,
            ILogger<FeedbackService> logger,
            ITradeAgentAuthenticationService tradeAgentAuthService,
            IOptions<ApiSettings> apiOptions)
        {
            _repository = repository;
            _logger = logger;
            _tradeAgentAuthService = tradeAgentAuthService;
            _bookingFeedbackSettings = apiOptions.Value.BookingFeedback;
        }

        /// <inheritdoc />
        public async Task Save(FeedbackInfoRequest feedbackInfoRequest)
        {
            var feedbackInfo = MapFeedbackInfo(feedbackInfoRequest);

            feedbackInfo.Business = _tradeAgentAuthService.IsTradePortalEnv()
                ? _bookingFeedbackSettings.BusinessTags.TradePortal
                : _bookingFeedbackSettings.BusinessTags.DefaultWebsite;

            try
            {
                await _repository.SaveAsync(feedbackInfo);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Saving item in dynamo db is failed. Item: {Item}", JsonConvert.SerializeObject(feedbackInfo));
                throw new ApiException(ApiExceptionCodes.FeedbackSaveError, ex.Message, null, ex.InnerException, System.Net.HttpStatusCode.InternalServerError);
            }
        }

        /// <summary>
        /// Map web request model to dynamo db model
        /// </summary>
        /// <param name="feedbackInfoRequest"></param>
        /// <returns></returns>
        private FeedbackInfo MapFeedbackInfo(FeedbackInfoRequest feedbackInfoRequest)
        {
            var comment = feedbackInfoRequest.Comment.Validate(new List<IReplace>
            {
                new DateReplacer(),
                new PhoneNumberReplacer(),
                new EmailReplacer(),
                new CardNumberReplacer()
            });

            var feedbackInfo = new FeedbackInfo
            {
                Question = feedbackInfoRequest.Question,
                QuestionId = Guid.NewGuid().ToString(),
                Icon = feedbackInfoRequest.Icon,
                Comment = comment,
                Date = DateTime.UtcNow,
                LocalTime = feedbackInfoRequest.LocalTime,
                MarketCode = feedbackInfoRequest.MarketCode,
                LanguageCode = feedbackInfoRequest.LanguageCode,
                BookingType = feedbackInfoRequest.BookingType
            };

            return feedbackInfo;
        }
    }
}
