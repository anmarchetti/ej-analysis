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
    [Service(typeof(IDestinationsSearchFiltersRepository), Lifetime = Lifetime.Transient)]
    public class DestinationsSearchFiltersRepository : SearchRepository, IDestinationsSearchFiltersRepository
    {
        public DestinationsSearchFiltersRepository(IDestinationSearchSettings indexSettings, IDestinationsLogger logger)
            : base(indexSettings, logger)
        {
        }

        public SearchResults<HotelSearchResultItem> GetAllFiltersByAccommodationCodes(List<string> codes)
        {
            logger.Debug($@"Calling {nameof(GetAllFiltersByAccommodationCodes)} with {nameof(codes)}:'{string.Join(", ", codes ?? new List<string>())}'", this);
            var query = Context.GetQueryable<HotelSearchResultItem>()
                .Where(item => item.TemplateId == Constants.TemplateIds.Accommodation)
                // Returning only necessary field to increase performance
                .Select(item => new
                {
                    item.SourceCodes,
                    item.Name,
                    item.FilteredFacilities,
                    item.Boards,
                    item.StarRating,
                    item.HotelRating,
                    item.Facilities,
                    item.IsMatrixOverriden,
                    item.MatrixOverride,
                })

                // Mapping anonymous object to HotelSearchResultItem
                .Select(item => new HotelSearchResultItem
                {
                    SourceCodes = item.SourceCodes,
                    Name = item.Name,
                    FilteredFacilities = item.FilteredFacilities,
                    Boards = item.Boards,
                    StarRating = item.StarRating,
                    HotelRating = item.HotelRating,
                    Facilities = item.Facilities,
                    IsMatrixOverriden = item.IsMatrixOverriden,
                    MatrixOverride = item.MatrixOverride,
                });

            var predicate = PredicateBuilder.True<HotelSearchResultItem>();
            foreach (var code in codes)
            {
                predicate = predicate.Or(item => item.SourceCodes.Contains(code));
            }

            query = query.Filter(predicate);

            return Search(query);
        }
    }
}