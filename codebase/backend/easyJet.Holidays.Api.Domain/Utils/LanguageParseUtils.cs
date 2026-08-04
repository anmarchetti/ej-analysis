namespace easyJet.Holidays.Api.Domain.Utils
{
    public class LanguageParseUtils
    {
        /// <summary>
        /// Parse the language required for the B2B service
        /// </summary>
        /// <param name="language">Language string</param>
        /// <returns>Parsed string Language</returns>
        public static string MapToLanguageCode(string language)
        {
            if (string.IsNullOrEmpty(language)) return "EN";

            switch (language)
            {
                case "de-DE":
                case "de-CH":
                    return "DE";
                case "fr-FR":
                case "fr-CH":
                    return "FR";
                case "en":
                default:
                    return "EN";
            }
        }
        public static string MapToAtcomLang(string lang)
        {
            switch (lang)
            {
                case "de-DE":
                case "de-CH":
                    return "de_DE";
                case "fr-FR":
                case "fr-CH":
                    return "fr_FR";
                default:
                    return "en_EN";
            }
        }
        public static string MapToCultureCode(string lang)
        {
            switch (lang)
            {
                case "de-DE":
                case "de-CH":
                    return "de-DE";
                case "fr-FR":
                case "fr-CH":
                    return "fr-FR";
                default:
                    return "en-GB";
            }
        }
    }
}
