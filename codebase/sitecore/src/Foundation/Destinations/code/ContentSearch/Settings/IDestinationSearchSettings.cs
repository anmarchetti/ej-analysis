using easyJet.Foundation.SitecoreExtensions.ContentSearch.Settings;

namespace easyJet.Foundation.Destinations.ContentSearch.Settings
{
    /// <summary>
    /// Represents Search Settings
    /// Holds current IndexName and DefaultIndexName.
    /// </summary>
    public interface IDestinationSearchSettings : ISearchSettings
    {
        string Root { get; }
    }
}