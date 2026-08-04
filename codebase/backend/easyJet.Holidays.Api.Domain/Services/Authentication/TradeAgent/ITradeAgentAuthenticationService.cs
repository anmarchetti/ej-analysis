using easyJet.Holidays.Api.Domain.Data.Authentication.Agent;

namespace easyJet.Holidays.Api.Domain.Services.Authentication.TradeAgent
{
    /// <summary>
    /// Authentication service
    /// </summary>
    public interface ITradeAgentAuthenticationService
    {
        /// <summary>
        ///  Gets trade agent credentials
        /// </summary>
        /// <returns></returns>
        AgentDetails GetCurrentAgent();

        /// <summary>
        /// Returns whether the current request originated from a logged in trade agent.
        /// </summary>
        /// <returns></returns>
        bool IsLoggedInAsTradeAgent();

        /// <summary>
        /// Returns whether the request originates from a TradePortal instance
        /// </summary>
        /// <returns></returns>
        bool IsTradePortalEnv();
    }
}