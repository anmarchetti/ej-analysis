using easyJet.Foundation.Destinations.ContentSearch.Settings;

namespace easyJet.Foundation.Destinations.ContentSearch.Repositories
{
    public class BaseTransferInfoRepository : SitecoreExtensions.ContentSearch.Repositories.SearchRepository
    {
        public BaseTransferInfoRepository(ITransferInfoSearchSettings settings)
            : base(settings)
        {
        }
    }
}