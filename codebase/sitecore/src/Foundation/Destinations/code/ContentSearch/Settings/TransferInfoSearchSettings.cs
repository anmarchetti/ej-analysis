using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;

namespace easyJet.Foundation.Destinations.ContentSearch.Settings
{
    /// <summary>
    /// Represents Trnasfer Info Search Settings
    /// Holds current IndexName and DefaultIndexName.
    /// </summary>
    [Service(typeof(ITransferInfoSearchSettings), Lifetime = Lifetime.Transient)]
    public class TransferInfoSearchSettings : ITransferInfoSearchSettings
    {
        public string IndexName { get; set; }

        public string DefaultIndexName { get; set; }

        public TransferInfoSearchSettings()
        {
            var database = Sitecore.Context.ContentDatabase ?? Sitecore.Context.Database;
            var databaseName = database?.Name?.ToLower();

            var indexName = Sitecore.Configuration.Settings.GetSetting("ContentSearch.TransferInfo.IndexName");

            IndexName = string.Format(indexName, databaseName);
            DefaultIndexName = $"sitecore_{databaseName}_index";
        }
    }
}