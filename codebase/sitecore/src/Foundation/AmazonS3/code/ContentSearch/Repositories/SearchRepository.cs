using easyJet.Foundation.AmazonS3.ContentSearch.Settings;

namespace easyJet.Foundation.AmazonS3.ContentSearch.Repositories
{
    public abstract class SearchRepository : SitecoreExtensions.ContentSearch.Repositories.SearchRepository, ISearchRepository
    {
        protected SearchRepository(ISearchSettings indexSettings)
            : base(indexSettings)
        {
        }
    }
}