namespace easyJet.Foundation.SitecoreExtensions.Services
{
    /// <summary>
    /// Provides access to query string parameters.
    /// </summary>
    public interface IQueryStringProvider
    {
        string GetQueryString(string key);
    }
}
