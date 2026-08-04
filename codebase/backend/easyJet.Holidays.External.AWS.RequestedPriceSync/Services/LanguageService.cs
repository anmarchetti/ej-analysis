
namespace easyJet.Holidays.External.AWS.RequestedPriceSync.Services;

internal class LanguageService : ISettableLanguageService
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

    public void SetLanguage(string language)
    {
        _language = language ?? throw new ArgumentNullException(nameof(language));
    }
}