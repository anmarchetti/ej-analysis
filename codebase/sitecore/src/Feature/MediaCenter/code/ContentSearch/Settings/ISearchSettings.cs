using Sitecore.Data;

namespace easyJet.Feature.MediaCenter.ContentSearch.Settings
{
    /// <summary>
    /// Represents Search Settings
    /// Holds current IndexName and DefaultIndexName.
    /// </summary>
    public interface ISearchSettings
    {
        string IndexName { get; set; }

        string DefaultIndexName { get; set; }

        /// <summary>
        /// Build index settings.
        /// </summary>
        /// <param name="currentDatabase">Sitecore database.</param>
        /// <returns>Index settings.</returns>
        ISearchSettings BuildSettings(Database currentDatabase);
    }
}
