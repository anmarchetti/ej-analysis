using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Interfaces.Cms;
using easyJet.Holidays.Api.Domain.Services.Language;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.Api.Domain.Services.Market
{
    public class MarketService : IMarketService
    {
        private readonly ILanguageService _languageService;
        private readonly ISettingsService _settingsService;
        private readonly LanguageSettings _languageSettings;
        /// <inheritdoc/>
        public MarketService(ILanguageService languageService, ISettingsService settingsService, IOptions<LanguageSettings> languageSettings)
        {
            _languageService = languageService;
            _settingsService = settingsService;
            _languageSettings = languageSettings?.Value ?? throw new ArgumentNullException(nameof(languageSettings));
        }

        /// <summary>
        /// Returns current market settings based on current context language.
        /// </summary>
        /// <returns></returns>
        public MarketSettings GetCurrentMarket()
        {
            var currentLanguage = _languageService.GetCurrentLanguage();
            if (currentLanguage == null)
                return null;

            var marketCode = _languageSettings.MarketLanguages.FirstOrDefault(x => x.Value.Contains(currentLanguage)).Key;
            var markets = this.GetAllMarketSettings();

            return markets.GetValueOrDefault(marketCode);
        }

        /// <inheritdoc/>
        public MarketSettings GetMarket(string marketCode)
        {
            if (marketCode == null)
            {
                return null;
            }
            return GetAllMarketSettings().GetValueOrDefault(marketCode);
        }

        /// <inheritdoc/>
        public string GetCurrencyFromMarketCode(string marketCode)
        {
            return GetMarket(marketCode)?.Currency.Code;
        }

        public MarketSettings GetMarketByLanguageCode(string languageCode)
        {
            var marketCode = _languageSettings.MarketLanguages.FirstOrDefault(x => x.Value.Contains(languageCode)).Key;
            var markets = this.GetAllMarketSettings();

            return markets.GetValueOrDefault(marketCode);
        }

        /// <inheritdoc />
        public bool IsValidCurrency(string currencyCode)
        {
            if (string.IsNullOrWhiteSpace(currencyCode))
            {
                return false;
            }

            var markets = GetAllMarketSettings();
            var codes = markets.Values.Select(market => market.Currency.Code).ToHashSet();

            return codes.Contains(currencyCode);
        }

        private Dictionary<string, MarketSettings> GetAllMarketSettings()
        {
            var settings = _settingsService.GetAllMarketSettings().Result;
            return settings;
        }
    }
}
