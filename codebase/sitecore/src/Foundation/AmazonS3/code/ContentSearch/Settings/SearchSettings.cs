using System.Diagnostics.CodeAnalysis;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;

namespace easyJet.Foundation.AmazonS3.ContentSearch.Settings
{
    /// <summary>
    /// Represents Search Settings
    /// Holds current IndexName.
    /// </summary>
    [ExcludeFromCodeCoverage]
    [Service(typeof(ISearchSettings), Lifetime = Lifetime.Transient)]
    public class SearchSettings : ISearchSettings
    {
        public string IndexName => "sitecore_master_index";

        public string DefaultIndexName => "sitecore_master_index";
    }
}