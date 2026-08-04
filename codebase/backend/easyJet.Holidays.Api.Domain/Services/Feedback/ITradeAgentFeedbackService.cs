using easyJet.Holidays.Api.Domain.Data.TradePortal.TradeAgentFeedback;

namespace easyJet.Holidays.Api.Domain.Services.Feedback
{
    public interface ITradeAgentFeedbackService
    {
        /// <summary>
        /// Persist a new feedback and send notification
        /// </summary>
        /// <param name="feedback">the new feedback to save</param>
        /// <returns>id of the notification message</returns>
        Task<string> Create(TradeAgentFeedbackRequest feedback);
    }
}
