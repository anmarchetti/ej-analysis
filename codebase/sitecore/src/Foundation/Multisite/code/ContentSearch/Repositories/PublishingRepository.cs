using System;
using System.Linq;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Multisite.ContentSearch.Queries;
using easyJet.Foundation.Multisite.ContentSearch.SearchTypes;
using easyJet.Foundation.Multisite.ContentSearch.Settings;
using easyJet.Foundation.SitecoreExtensions.ContentSearch.Repositories;
using Sitecore.ContentSearch.Linq;

namespace easyJet.Foundation.Multisite.ContentSearch.Repositories
{
    [Service(typeof(IPublishingRepository), Lifetime = Lifetime.Transient)]
    public class PublishingRepository : SearchRepository, IPublishingRepository
    {
        public PublishingRepository(IPublisingSearchSetting indexSettings)
            : base(indexSettings)
        {
        }

        /// <inheritdoc/>
        public SearchResults<PublishableSearchResultItem> GetPublishableItem(PublishableItemQueryArgs args)
        {
            DateTime utcNow = DateTime.UtcNow;
            DateTime publishableDateTime = utcNow.Add(-args.PublishableTimeRange);

            var query = Context.GetQueryable<PublishableSearchResultItem>()
                .Where(x =>
                (x.ValidTo >= publishableDateTime && x.ValidTo <= utcNow) ||
                (x.ValidFrom >= publishableDateTime && x.ValidFrom <= utcNow) ||
                (x.PublishDate >= publishableDateTime && x.PublishDate <= utcNow) ||
                (x.UnpublishDate >= publishableDateTime && x.UnpublishDate <= utcNow));

            if (!string.IsNullOrEmpty(args.RootPath))
            {
                query = query.Where(x => x.Path.StartsWith(args.RootPath));
            }

            return Search(query, shouldSearchInAllVersions: true);
        }
    }
}