using easyJet.Holidays.Api.Domain.Data.Authentication.Agent;
using easyJet.Holidays.Api.Domain.Services.Authentication.TradeAgent;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.Api.Domain.Services.Authentication
{
    /// <summary>
    /// <see cref="IAuthenticationService"/> implementation
    /// </summary>
    public class TradeAgentAuthenticationService : ITradeAgentAuthenticationService
    {
        private readonly ITradeAgentCookieAuthService _tradeAgentCookieService;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly TradePortalSettings _tradePortalSettings;
        private readonly EnvironmentBehaviourSettings _environmentBehaviourSettings;

        /// <summary>
        /// Create instance of <see cref="TradeAgentAuthenticationService" />
        /// </summary>
        /// <param name="tradePortalSettings"></param>
        /// <param name="environmentBehaviourSettings"></param>
        /// <param name="tradeAgentCookieService"></param>
        /// <param name="httpContextAccessor"></param>
        public TradeAgentAuthenticationService(
            IOptions<TradePortalSettings> tradePortalSettings,
            IOptions<EnvironmentBehaviourSettings> environmentBehaviourSettings,
            ITradeAgentCookieAuthService tradeAgentCookieService,
            IHttpContextAccessor httpContextAccessor)
        {
            _tradePortalSettings = tradePortalSettings.Value
                ?? throw new ArgumentNullException(nameof(_tradePortalSettings));

            _environmentBehaviourSettings = environmentBehaviourSettings.Value
                ?? throw new ArgumentNullException(nameof(_environmentBehaviourSettings));

            _tradeAgentCookieService = tradeAgentCookieService;
            _httpContextAccessor = httpContextAccessor;
        }

        /// <inheritdoc />
        public AgentDetails GetCurrentAgent()
        {
            return IsTradePortalEnv() ? GetTokenAuth() ?? GetCookieAuth() : null;
        }

        /// <inheritdoc />
        public bool IsLoggedInAsTradeAgent()
        {
            return IsTradePortalEnv() && HasTradeAgentCredentials();
        }

        /// <inheritdoc />
        public bool IsTradePortalEnv() => _environmentBehaviourSettings.IsTradePortal;


        private AgentDetails GetCookieAuth()
        {
            var auth = _tradeAgentCookieService.GetCredentials();

            return auth == null ? null : new AgentDetails { Number = auth.Number, Name = auth.Ref };
        }

        private AgentDetails GetTokenAuth()
        {
            var context = _httpContextAccessor.HttpContext;

            if (context?.User == null)
                return null;

            var abta = context.User.FindFirst("abta")?.Value;
            var name = context.User.FindFirst("preferred_username")?.Value;

            return abta != null && name != null ? new AgentDetails { Name = name, Number = abta } : null;
        }

        private bool HasTradeAgentCredentials()
        {
            return !string.IsNullOrWhiteSpace(GetCurrentAgent()?.Number);
        }
    }
}