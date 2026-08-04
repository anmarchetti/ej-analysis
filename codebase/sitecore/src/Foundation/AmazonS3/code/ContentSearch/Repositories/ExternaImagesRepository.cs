using System.Linq;
using easyJet.Foundation.AmazonS3.ContentSearch.SearchTypes;
using easyJet.Foundation.AmazonS3.ContentSearch.Settings;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using Sitecore.ContentSearch.Linq;
using DestinationsConstants = easyJet.Foundation.Destinations.Constants;

namespace easyJet.Foundation.AmazonS3.ContentSearch.Repositories
{
    [Service(typeof(IExternaImagesRepository), Lifetime = Lifetime.Transient)]
    public class ExternaImagesRepository : SearchRepository, IExternaImagesRepository
    {
        public ExternaImagesRepository(ISearchSettings indexSettings)
            : base(indexSettings)
        {
        }

        /// <inheritdoc/>
        public SearchResults<BaseExternalImageSearchResultItem> GetDuplicates(string imageUrl)
        {
            var query = Context.GetQueryable<BaseExternalImageSearchResultItem>()
                .Where(item => item.TemplateId == DestinationsConstants.TemplateIds.ExternalImage)
                .Where(item => item.LargeImageUrl == imageUrl);

            // Taken 2 items for more faster search. If we have 2 search result items , this means that item has duplicates.
            return Search(query, take: 2);
        }
    }
}