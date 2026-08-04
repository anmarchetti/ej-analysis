using easyJet.Foundation.AmazonS3.ContentSearch.SearchTypes;
using Sitecore.ContentSearch.Linq;

namespace easyJet.Foundation.AmazonS3.ContentSearch.Repositories
{
    public interface IExternaImagesRepository
    {
        /// <summary>
        /// Get duplicates.
        /// </summary>
        /// <param name="imageUrl">Image URL.</param>
        /// <returns>Get duplicates of item.</returns>
        SearchResults<BaseExternalImageSearchResultItem> GetDuplicates(string imageUrl);
    }
}
