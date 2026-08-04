using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.SitecoreExtensions.ContentSearch.Settings;

namespace easyJet.Foundation.Destinations.ContentSearch.Settings
{
    /// <summary>
    /// Represents Search Settings
    /// Holds current IndexName and DefaultIndexName.
    /// </summary>
    [Service(typeof(IDestinationSearchSettings), Lifetime = Lifetime.Transient)]
    public class DestinationSearchSettings : BaseSearchSettings, IDestinationSearchSettings
    {
        public string Root => Sitecore.Configuration.Settings.GetSetting("ContentSearch.Destinations.RootPath");

        public override string IndexName => string.Format(Sitecore.Configuration.Settings.GetSetting("ContentSearch.Destinations.IndexName"), DatabaseName);
    }
}