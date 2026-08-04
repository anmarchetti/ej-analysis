#nullable enable
using easyJet.Holidays.Api.Domain.Data.Authentication.Agent;
using easyJet.Holidays.Api.Domain.Services.Authentication.TradeAgent;
using easyJet.Holidays.Api.Domain.Services.Language;
using easyJet.Holidays.Api.Domain.Services.Market;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Api.Domain.Utils;
using easyJet.Holidays.External.Atcom.Models.Internal;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.Atcom.Services
{
    public class AtcomRequestGenerator
    {
        /// <summary>
        /// Represents the name of the default agent group used when no specific group is specified.
        /// </summary>
        public static string DefaultAgentGroup => "default";
        private readonly AtcomSettings _atcomSettings;
        private readonly ITradeAgentAuthenticationService _tradeAgentAuthService;
        private readonly IMarketService _marketService;
        private readonly ILanguageService _languageService;
        public AtcomRequestGenerator(
            IOptions<AtcomSettings> atcomSettings,
            ITradeAgentAuthenticationService tradeAgentAuthService,
            IMarketService marketService,
            ILanguageService languageService)
        {
            _atcomSettings = atcomSettings.Value ?? throw new ArgumentNullException(nameof(atcomSettings));
            _tradeAgentAuthService = tradeAgentAuthService;
            _marketService = marketService;
            _languageService = languageService;
        }

        public string GetCurrentAtcomLanguage()
        {
            return LanguageParseUtils.MapToAtcomLang(_languageService.GetCurrentLanguage());
        }

        /// <summary>
        /// Build CltInfo based on provided marketCode and language. Value is not cached because of current culture info usage.
        /// </summary>
        /// <returns></returns>
        public CltInfo BuildCltInfo(string marketCode, string language, bool isAgentRequired = true, IList<string>? promotionAgentKeys = null)
        {
            var currentAgent = _tradeAgentAuthService?.GetCurrentAgent();
            var cltInfo = BuildCltInfo(marketCode, language, currentAgent, isAgentRequired, promotionAgentKeys);
            return cltInfo;
        }

        /// <summary>
        /// Build CltInfo based on provided marketCode and language. Value is not cached because of current culture info usage.
        /// </summary>
        /// <returns></returns>
        public CltInfo BuildCltInfo(string marketCode, string language, AgentDetails currentAgent, bool isAgentRequired = true, IList<string>? promotionAgentKey = null)
        {
            ArgumentNullException.ThrowIfNull(_atcomSettings.CltInfo);

            if(promotionAgentKey == null || promotionAgentKey.Count == 0)
            {
                return CltInfoFactory(marketCode, language, currentAgent, isAgentRequired, _atcomSettings.CltInfo.AgentGroups[DefaultAgentGroup]);
            }

            var key = promotionAgentKey.FirstOrDefault(pak => _atcomSettings.CltInfo.AgentGroups.ContainsKey(pak) && _atcomSettings.CltInfo.AgentGroups[pak].AgentsNames.ContainsKey(marketCode));
            if (key is not null)
            {
                return CltInfoFactory(marketCode, language, currentAgent, isAgentRequired, _atcomSettings.CltInfo.AgentGroups[key]);
            }
            return CltInfoFactory(marketCode, language, currentAgent, isAgentRequired, _atcomSettings.CltInfo.AgentGroups[DefaultAgentGroup]);

            CltInfo CltInfoFactory(string marketCode, string language, AgentDetails currentAgent, bool isAgentRequired, AtcomCltInfoAgentsSettings AgentGroup)
            {
                AgentGroup.AgentsNames.TryGetValue(marketCode, out var agentName);
                AgentGroup.UserNames.TryGetValue(marketCode, out var userName);
                var cltInfo = new CltInfo
                {
                    Locale = LanguageParseUtils.MapToAtcomLang(language),
                    Agt_No = currentAgent != null ? currentAgent.Number : agentName,
                    TermCode = _atcomSettings.CltInfo.TermCode,
                    User_Name = currentAgent != null ? _atcomSettings.CltInfo.TradePortalUserName : userName,
                    Chan = _atcomSettings.CltInfo.Channel,
                    Exp_No = currentAgent != null ? currentAgent.Name : string.Empty
                };
                if (!isAgentRequired)
                {
                    cltInfo.Agt_No = string.Empty;
                }
                return cltInfo;
            }
        }

        /// <summary>
        /// Build CltInfo based on current language. Value is not cached because of current culture info usage.
        /// </summary>
        /// <returns></returns>
        public CltInfo BuildCurrentCltInfo(bool isAgentRequired = true, IList<string>? promotionAgentKey = null)
        {
            return BuildCltInfo(_marketService.GetCurrentMarket()?.Code ?? string.Empty, _languageService.GetCurrentLanguage(), isAgentRequired, promotionAgentKey);
        }

        /// <summary>
        /// use supplierId as agent number if it's not empty
        /// </summary>
        /// <param name="cltInfo">Object to update</param>
        /// <param name="supplierId">Supplier id</param>
        /// <returns>Updated culture info</returns>
        public CltInfo UseSupplierId(CltInfo cltInfo, string supplierId)
        {
            if (!string.IsNullOrEmpty(supplierId))
            {
                cltInfo.Agt_No = supplierId;
            }

            return cltInfo;
        }
    }
}
