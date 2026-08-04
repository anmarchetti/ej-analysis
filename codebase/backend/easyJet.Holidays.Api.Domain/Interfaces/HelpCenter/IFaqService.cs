using easyJet.Holidays.Api.Domain.Data.DynamoDB.HelpCenter;

namespace easyJet.Holidays.Api.Domain.Interfaces.HelpCenter
{
    /// <summary>
    /// Faq service interface
    /// </summary>
    public interface IFaqService
    {
        /// <summary>
        /// Save info without personal details(emails, phone numbers, card numbers) 
        /// </summary>
        /// <param name="faqInfo"></param>
        /// <returns></returns>
        Task Save(FaqInfo faqInfo);
    }
}