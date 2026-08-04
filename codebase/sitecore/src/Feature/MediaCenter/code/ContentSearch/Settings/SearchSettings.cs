using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using Sitecore.Data;

namespace easyJet.Feature.MediaCenter.ContentSearch.Settings
{
    /// <summary>
    /// Represents Search Settings
    /// Holds current IndexName and DefaultIndexName.
    /// </summary>
    [Service(typeof(ISearchSettings), Lifetime = Lifetime.Transient)]
    public class SearchSettings : ISearchSettings
    {
        public string IndexName { get; set; }

        public string DefaultIndexName { get; set; }

        /// <summary>
        /// Initializes a new instance of the <see cref="SearchSettings"/> class.
        /// Setting index name for current database or set by default indexname.
        /// </summary>
        /// <param name="currentDatabase">Sitecore database.</param>
        public SearchSettings(Database currentDatabase = null)
        {
            var database = currentDatabase != null ? currentDatabase : Sitecore.Context.Database ?? Sitecore.Context.ContentDatabase;
            var databaseName = database?.Name?.ToLower() ?? Constants.Common.MasterDb;

            var indexName = Sitecore.Configuration.Settings.GetSetting("ContentSearch.Articles.IndexName");

            IndexName = string.Format(indexName, databaseName);
            DefaultIndexName = $"sitecore_{databaseName}_index";
        }

        /// <inheritdoc/>
        public ISearchSettings BuildSettings(Database currentDatabase)
        {
            return new SearchSettings(currentDatabase);
        }
    }
}