namespace easyJet.Holidays.Api.Domain.Interfaces.Transliteration
{
    /// <summary>
    /// Provides functionality for transliterating characters to their representations
    /// </summary>
    public interface ITransliterationService
    {
        /// <summary>
        /// Transliterates all non-english characters to their english representations
        /// </summary>
        /// <param name="text"></param>
        /// <returns>Text containing only english characters</returns>
        string ToEnglish(string text);
    }
}
