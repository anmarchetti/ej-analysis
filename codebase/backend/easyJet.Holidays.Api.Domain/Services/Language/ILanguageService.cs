namespace easyJet.Holidays.Api.Domain.Services.Language
{
    public interface ILanguageService
    {
        /// <summary>
        /// Gets currently selected language (from cookies)
        /// </summary>
        /// <returns></returns>
        string GetCurrentLanguage();

        /// <summary>
        /// Get default Language
        /// </summary>
        /// <returns>the default language.</returns>
        string GetDefaultLanguage();
    }
}
