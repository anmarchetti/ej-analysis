using easyJet.Holidays.Api.Domain.Data.Authentication.Agent;

namespace easyJet.Holidays.Api.Domain.Services.Authentication.TradeAgent
{
    /// <summary>
    /// Trade agent details provider
    /// </summary>
    public interface ITradeAgentProvider
    {
        /// <summary>
        /// Get detailed trade agent data
        /// </summary>
        /// <param name="creds"></param>
        /// <returns></returns>
        Task<AgentDetails> GetDetails(AgentCredentials creds);
    }
}