using easyJet.Holidays.Api.Domain.Services.Language;

namespace easyJet.Holidays.External.AWS.RequestedPriceSync.Services;

/// <summary>
/// Hack to bypass whatever the current language flow is supposed to be.
/// </summary>
public interface ISettableLanguageService : ILanguageService
{
    /// <summary>
    /// sets the language 
    /// </summary>
    /// <param name="language"></param>
    void SetLanguage(string language);
}