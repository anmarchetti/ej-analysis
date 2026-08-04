using easyJet.Holidays.Api.Domain.Data.HelpCenter;

namespace easyJet.Holidays.Api.Domain.Interfaces.HelpCenter
{
    /// <summary>
    /// Feedback service
    /// </summary>
    public interface IFeedbackService
    {
        /// <summary>
        /// Save user's feedback info in storage
        /// </summary>
        /// <param name="feedbackInfoRequest"></param>
        /// <returns></returns>
        Task Save(FeedbackInfoRequest feedbackInfoRequest);
    }
}
