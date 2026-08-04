using easyJet.Holidays.Api.Domain.Data.Feedback;
using easyJet.Holidays.Api.Domain.Data.TradePortal.TradeAgentFeedback;

namespace easyJet.Holidays.Api.Domain.Interfaces.Feedback
{
    /// <summary>
    /// TradeAgentFeedback services
    /// </summary>
    public interface ITradeAgentFeedbackRepository
    {
        /// <summary>
        /// Persists a new <see cref="TradeAgentFeedbackRequest"/> to the configured dynamo db table
        /// </summary>
        /// <param name="feedback">the feedback to persist</param>
        /// <returns>An <see cref="IEnumerable{T}"/> of saved files that might have been attached to <paramref name="feedback"/></returns>
        Task<IEnumerable<TradeAgentFeedbackAttachment>> Create(TradeAgentFeedbackRequest feedback);
    }
}
