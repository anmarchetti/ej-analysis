using easyJet.Holidays.Api.Domain.Data.Authentication.Agent;
using System.Runtime.CompilerServices;

// Make GetCredentials method visible to Moq
[assembly: InternalsVisibleTo("DynamicProxyGenAssembly2")]

namespace easyJet.Holidays.Api.Domain.Services.Authentication.TradeAgent
{
    /// <summary>
    /// Service maintaing cookies dedicated for trade agent
    /// </summary>
    public interface ITradeAgentCookieAuthService
    {
        /// <summary>
        /// Sets cookie with trade agent credentials
        /// </summary>
        /// <param name="credentials"></param>
        /// <returns></returns>
        Task<AgentDetails> Login(AgentCredentials credentials);

        /// <summary>
        ///  Removes cookie with trade agent credentials
        /// </summary>
        void Logout();

        /// <summary>
        /// Returns trade agent credetials
        /// </summary>
        /// <returns></returns>
        internal AgentCredentials GetCredentials();

        /// <summary>
        /// Sets cookie with trade agent data
        /// </summary>
        /// <param name="credentials"></param>
        internal Task SetCookie(AgentCredentials credentials);
    }
}