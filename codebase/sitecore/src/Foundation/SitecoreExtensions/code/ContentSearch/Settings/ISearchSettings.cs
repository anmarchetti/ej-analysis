namespace easyJet.Foundation.SitecoreExtensions.ContentSearch.Settings
{
    /// <summary>
    /// Represents Search Settings
    /// Holds current IndexName and DefaultIndexName.
    /// </summary>
    public interface ISearchSettings
    {
        string IndexName { get; }

        string DefaultIndexName { get; }
    }
}
