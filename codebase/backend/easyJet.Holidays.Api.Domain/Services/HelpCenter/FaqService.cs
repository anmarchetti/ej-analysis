using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.DynamoDB.HelpCenter;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Interfaces.HelpCenter;
using easyJet.Holidays.Api.Domain.Interfaces.Repositories;
using easyJet.Holidays.Api.Domain.Interfaces.Validators;
using easyJet.Holidays.Api.Domain.Validators;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;

namespace easyJet.Holidays.Api.Domain.Services.HelpCenter
{
    /// <summary>
    /// Faq service
    /// </summary>
    public class FaqService : IFaqService
    {
        private readonly IAWSDbRepository<FaqInfo> _repository;
        private readonly ILogger<FaqService> _logger;

        /// <summary>
        /// Faq service ctor
        /// </summary>
        /// <param name="repository"></param>
        /// <param name="logger"></param>
        public FaqService(
            IAWSDbRepository<FaqInfo> repository,
            ILogger<FaqService> logger)
        {
            _repository = repository;
            _logger = logger;
        }

        /// <summary>
        /// Save info without personal details(emails, phone numbers, card numbers)
        /// </summary>
        /// <param name="faqInfo"></param>
        /// <returns></returns>
        /// <exception cref="ApiException"></exception>
        public async Task Save(FaqInfo faqInfo)
        {
            faqInfo.Text = faqInfo.Text.Validate(new List<IReplace>
            {
                new DateReplacer(),
                new PhoneNumberReplacer(),
                new EmailReplacer(),
                new CardNumberReplacer()
            });

            faqInfo.QuestionId = Guid.NewGuid().ToString();
            faqInfo.Date = DateTime.UtcNow;

            try
            {
                await _repository.SaveAsync(faqInfo);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Saving item in dynamo db is failed. Item: {Item}", JsonConvert.SerializeObject(faqInfo));
                throw new ApiException(ApiExceptionCodes.FeedbackSaveError, ex.Message, null, ex.InnerException, System.Net.HttpStatusCode.InternalServerError);
            }
        }
    }
}