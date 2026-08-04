namespace easyJet.Holidays.Api.Domain.Utils
{
    public static class LanguageUtils
    {
        public static string GetLanguageCode(string language)
        {
            var dash = language.IndexOf('-');
            return dash > 0 ? language.Substring(0, dash) : language;
        }

        public static string GetCountryCode(string language)
        {
            var dash = language.IndexOf("Cyrl", StringComparison.InvariantCultureIgnoreCase) > 0 ||
                       language.IndexOf("Latn", StringComparison.InvariantCultureIgnoreCase) > 0
                ? language.LastIndexOf('-')
                : language.IndexOf('-');

            return dash > 0 && dash < language.Length - 1 ? language.Substring(dash + 1) : null;
        }
    }
}
