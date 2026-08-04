using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.Api.Domain.Services.Language
{
    public class LanguageService : ILanguageService
    {
        private readonly LanguageSettings _languageSettings;
        private readonly CookiesSettings _cookiesSettings;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public LanguageService(IOptions<LanguageSettings> languageSettings, IOptions<CookiesSettings> cookiesSettings, IHttpContextAccessor httpContextAccessor)
        {
            _languageSettings = languageSettings.Value ?? throw new ArgumentNullException(nameof(languageSettings));
            _cookiesSettings = cookiesSettings?.Value ?? throw new ArgumentNullException(nameof(cookiesSettings));
            _httpContextAccessor = httpContextAccessor ?? throw new ArgumentNullException(nameof(httpContextAccessor));
        }

        /// <inheritdoc />
        public string GetCurrentLanguage()
        {
            return GetHttpContextLanguage() ?? _languageSettings.DefaultLanguage;
        }

        /// <inheritdoc />
        public string GetDefaultLanguage()
        {
            return _languageSettings.DefaultLanguage;
        }

        private string GetHttpContextLanguage()
        {
            if (string.IsNullOrEmpty(_cookiesSettings.Language) || _httpContextAccessor.HttpContext?.Request?.Cookies == null)
                return null;

            return _httpContextAccessor.HttpContext.Request.Cookies
                .FirstOrDefault(c => _cookiesSettings.Language.Equals(c.Key, StringComparison.InvariantCultureIgnoreCase)).Value;
        }
    }
}
