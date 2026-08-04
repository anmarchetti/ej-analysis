namespace easyJet.Foundation.SitecoreExtensions.ContentSearch.Settings
{
    public abstract class BaseSearchSettings : ISearchSettings
    {
        public abstract string IndexName { get; }

        public string DefaultIndexName { get; }

        public BaseSearchSettings()
        {
            DefaultIndexName = $"sitecore_{DatabaseName}_index";
        }

        protected static string DatabaseName => (Sitecore.Context.ContentDatabase ?? Sitecore.Context.Database)?.Name?.ToLower();
    }
}
