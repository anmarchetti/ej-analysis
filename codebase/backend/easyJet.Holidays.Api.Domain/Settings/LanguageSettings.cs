namespace easyJet.Holidays.Api.Domain.Settings
{
    public class LanguageSettings
    {
        public string DefaultLanguage { get; set; }

        public IEnumerable<string> AllLanguages { get; set; }

        public Dictionary<string, string> MarketMasterLanguageMap { get; set; }
        public Dictionary<string, IEnumerable<string>> MarketLanguages { get; set; }
        public Dictionary<string, string> BasePaths { get; set; }
    }
}
