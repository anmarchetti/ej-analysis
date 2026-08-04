using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.ContentSearch.Repositories
{
    public interface IFilterPillsRepository
    {
        /// <summary>
        /// Get recommended filters configuration item.
        /// </summary>
        /// <returns>Recommended filters configuration item.</returns>
        Item GetFilterPillsItem();

        /// <summary>
        /// Get recommended filters configuration item.
        /// </summary>
        /// <returns>Recommended filters configuration item.</returns>
        Item GetRecommendedFiltersItem();
    }
}
