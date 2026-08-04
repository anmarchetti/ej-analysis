using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using easyJet.Foundation.Destinations.ContentSearch.Settings;
using easyJet.Foundation.Destinations.Logging;
using Sitecore.ContentSearch.Linq;
using Sitecore.ContentSearch.Linq.Utilities;

namespace easyJet.Foundation.Destinations.ContentSearch.Repositories
{
    /// <summary>
    /// Represents Search logic for Room Types items.
    /// </summary>
    [Service(typeof(IRoomTypesRepository), Lifetime = Lifetime.Transient)]
    public class RoomTypesRepository : SearchRepository, IRoomTypesRepository
    {
        public RoomTypesRepository(IDestinationSearchSettings indexSettings, IDestinationsLogger logger)
            : base(indexSettings, logger)
        {
        }

        /// <inheritdoc />
        public SearchResults<RoomTypeSearchResultItem> GetAll()
        {
            var query = Context.GetQueryable<RoomTypeSearchResultItem>()
                .Where(item => item.TemplateId == Constants.TemplateIds.RoomType);

            return Search(query);
        }

        public SearchResults<RoomTypeSearchResultItem> Get(int page, int take)
        {
            var query = Context.GetQueryable<RoomTypeSearchResultItem>()
                .Where(item => item.TemplateId == Constants.TemplateIds.RoomType);

            return Search(query, page, take);
        }

        public SearchResults<RoomTypeSearchResultItem> GetByCodes(string[] codes)
        {
            logger.Info($@"Calling {nameof(GetByCodes)} with {nameof(codes)}:'{string.Join(", ", codes ?? Array.Empty<string>())}'", this);
            var query = Context.GetQueryable<RoomTypeSearchResultItem>()
                .Where(item => item.TemplateId == Constants.TemplateIds.RoomType);

            var predicate = PredicateBuilder.True<RoomTypeSearchResultItem>();

            foreach (var code in codes)
            {
                predicate = predicate.Or(item => item.Code == code);
            }

            query = query.Filter(predicate);
            return Search(query);
        }
    }
}