using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;

namespace easyJet.Foundation.Multisite.ContentSearch.Settings
{
    /// <summary>
    /// Represents Search Settings
    /// Holds current IndexName and DefaultIndexName.
    /// </summary>
    [Service(typeof(IPublisingSearchSetting), Lifetime = Lifetime.Transient)]
    public class PublisingSearchSetting : IPublisingSearchSetting
    {
        public string IndexName { get; set; }

        public string DefaultIndexName { get; set; }

        /// <summary>
        /// Initializes a new instance of the <see cref="PublisingSearchSetting"/> class.
        /// Setting index name for current database or set by default indexname.
        /// </summary>
        public PublisingSearchSetting()
        {
            IndexName = Sitecore.Configuration.Settings.GetSetting("Mulisite.PublisingIndexName", "sitecore_publising_index");
            DefaultIndexName = "sitecore_master_index";
        }
    }
}