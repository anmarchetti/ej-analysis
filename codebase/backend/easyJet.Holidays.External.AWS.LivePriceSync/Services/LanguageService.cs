using easyJet.Holidays.Api.Domain.Services.Language;

namespace easyJet.Holidays.External.AWS.LivePriceSync.Services;

public class LanguageService : ILanguageService
{
    private string _language;

    public LanguageService(string language)
    {
        _language = language;
    }

    public string GetCurrentLanguage()
    {
        return _language;
    }

    public string GetDefaultLanguage()
    {
        return GetCurrentLanguage();
    }

    internal void SetLanguage(string language)
    {
        _language = language ?? throw new ArgumentNullException(language);
    }
}