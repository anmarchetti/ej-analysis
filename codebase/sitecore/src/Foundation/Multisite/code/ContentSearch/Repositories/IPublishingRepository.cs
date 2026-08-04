using easyJet.Foundation.Multisite.ContentSearch.Queries;
using easyJet.Foundation.Multisite.ContentSearch.SearchTypes;
using Sitecore.ContentSearch.Linq;

namespace easyJet.Foundation.Multisite.ContentSearch.Repositories
{
    public interface IPublishingRepository
    {
        /// <summary>
        /// Get items that have a publishable date range and items that are now within their publishable date range.
        /// </summary>
        /// <param name="args">Publishable date range and templates query arguments for filtring items.</param>
        /// <returns>Array of publishable items.</returns>
        SearchResults<PublishableSearchResultItem> GetPublishableItem(PublishableItemQueryArgs args);
    }
}
