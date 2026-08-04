namespace easyJet.Holidays.Api.Domain.Settings
{
    /// <summary>
    /// Transliteration settings
    /// </summary>
    public class TransliterationSettings
    {
        /// <summary>
        /// English single lowercase character look up table
        /// </summary>
        public Dictionary<string, string> EnglishSingleCharacterLowerCaseLookUpTable { get; set; }
        /// <summary>
        /// English single uppercase character look up table
        /// </summary>
        public Dictionary<string, string> EnglishSingleCharacterUpperCaseLookUpTable { get; set; }
        /// <summary>
        /// English complex character look up table
        /// </summary>
        public Dictionary<string, string> EnglishComplexCharactersLookUpTable { get; set; }
        /// <summary>
        /// Collection of characters indicating complex character
        /// </summary>
        public string[] ComplexCharacters { get; set; }
    }
}
