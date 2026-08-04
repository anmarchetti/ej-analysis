using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Destinations.ContentSearch.Fields;
using easyJet.Foundation.Destinations.ContentSearch.Predicates;
using easyJet.Foundation.Destinations.ContentSearch.Queries;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using easyJet.Foundation.Destinations.ContentSearch.Settings;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Models;
using easyJet.Foundation.Destinations.Models.Requests;
using easyJet.Foundation.SitecoreExtensions.ContentSearch.BasePredicates;
using Sitecore.ContentSearch;
using Sitecore.ContentSearch.Linq;
using Sitecore.ContentSearch.Linq.Utilities;
using Sitecore.ContentSearch.SearchTypes;
using Sitecore.ContentSearch.SolrNetExtension;
using Sitecore.ContentSearch.SolrProvider.SolrNetIntegration;
using Sitecore.Data;
using Sitecore.Globalization;
using SolrNet.Commands.Parameters;

namespace easyJet.Foundation.Destinations.ContentSearch.Repositories
{
    /// <summary>
    /// Represents Search logic for Destination items.
    /// </summary>
    [Service(typeof(IDestinationsRepository), Lifetime = Lifetime.Transient)]
    public class DestinationsRepository : SearchRepository, IDestinationsRepository
    {
        public DestinationsRepository(IDestinationSearchSettings indexSettings, IDestinationsLogger logger)
            : base(indexSettings, logger)
        {
        }

        /// <inheritdoc/>
        public SearchResults<HotelSearchResultItem> SearchHotelsByCodes(string[] codes)
        {
            logger.Debug($@"Calling {nameof(SearchHotelsByCodes)} with {nameof(codes)}:'{string.Join(", ", codes ?? Array.Empty<string>())}'", this);
            var query = Context.GetQueryable<HotelSearchResultItem>()
                .Where(item => item.TemplateId == Constants.TemplateIds.Accommodation);

            var predicate = PredicateBuilder.True<HotelSearchResultItem>();
            foreach (var code in codes)
            {
                predicate = predicate.Or(item => item.SourceCodes.Contains(code) || item.GiataCode == code);
            }

            query = query.Filter(predicate);
            return Search(query);
        }

        /// <inheritdoc/>
        public SearchResults<HotelSyncSearchResultItem> SearchSyncHotelsByQuery(
            Expression<Func<HotelSyncSearchResultItem, bool>> filterQuery,
            Language language,
            List<string> atcomCodes = null)
        {
            logger.Info($@"Calling {nameof(SearchSyncHotelsByQuery)} with {nameof(atcomCodes)}:'{string.Join(", ", atcomCodes ?? new List<string>())}'", this);
            var query = Context.GetQueryable<HotelSyncSearchResultItem>()
                .Where(x => x.TemplateId == Constants.TemplateIds.Accommodation);

            query = query.Where(filterQuery);

            var predicate = PredicateBuilder.False<HotelSyncSearchResultItem>();

            if (atcomCodes?.Any() ?? false)
            {
                foreach (var atcomCode in atcomCodes)
                {
                    predicate = predicate.Or(item => item.SourceCodes.Contains(atcomCode));
                }

                query = query.Where(predicate);
            }

            return Search(query, language: language);
        }

        /// <inheritdoc/>
        public SearchResults<HotelSearchResultItem> SearchHotelTransfersByIds(string[] ids)
        {
            logger.Info($@"Calling {nameof(SearchHotelTransfersByIds)} with {nameof(ids)}:'{string.Join(", ", ids ?? Array.Empty<string>())}'", this);
            var query = Context.GetQueryable<HotelSearchResultItem>()
                .Where(item => item.TemplateId == Constants.TemplateIds.Accommodation)
                // Returning only necessary field to increase performance
                .Select(item => new
                {
                    item.Transfers,
                })
                // Mapping anonymous object to HotelSearchResultItem
                .Select(item => new HotelSearchResultItem
                {
                    Transfers = item.Transfers,
                });

            var predicate = PredicateBuilder.True<HotelSearchResultItem>();
            foreach (var id in ids)
            {
                predicate = predicate.Or(item => item.SourceCodes.Contains(id));
            }

            query = query.Filter(predicate);
            return Search(query);
        }

        /// <inheritdoc/>
        public SearchResults<BaseDestinationsSearchResultItem> SearchByName(string name, bool showOnSearchPod = false, bool shouldGetItemsForAutocompleteOnly = true, DestinationFilter destinationFilter = DestinationFilter.All, bool includeSearchByAirportCode = false)
        {
            logger.Info($@"Calling {nameof(SearchByName)} with {nameof(name)}:'{name}', {nameof(showOnSearchPod)}:'{showOnSearchPod}', {nameof(shouldGetItemsForAutocompleteOnly)}:'{shouldGetItemsForAutocompleteOnly}', {nameof(destinationFilter)}:'{destinationFilter}', {nameof(includeSearchByAirportCode)}:'{includeSearchByAirportCode}'", this);
            var query = Context.GetQueryable<BaseDestinationsSearchResultItem>();

            // Find full Destination item's
            var destinationPredicate = PredicateBuilder.True<BaseDestinationsSearchResultItem>();
            destinationPredicate = destinationPredicate.MatchDestinations(destinationFilter);

            var predicate = PredicateBuilder.False<BaseDestinationsSearchResultItem>();
            var namePredicate = PredicateBuilder.True<BaseDestinationsSearchResultItem>();
            var splitedNamePredicate = PredicateBuilder.True<BaseDestinationsSearchResultItem>();
            var airportsPredicate = PredicateBuilder.True<BaseDestinationsSearchResultItem>();

            if (!string.IsNullOrWhiteSpace(name))
            {
                // Find full Destination item's name
                namePredicate = namePredicate.And(item => item.ItemName.Equals(name).Boost(1.5f));

                // Find part of Destination item's name
                var splittedNames = name.Split(' ');
                foreach (var splittedName in splittedNames)
                {
                    splitedNamePredicate = splitedNamePredicate.And(item => item.ItemName.Contains(splittedName));
                }

                // Include search by airport codes (EJH-9526)
                airportsPredicate = includeSearchByAirportCode ? airportsPredicate.IncludeSeachByAirportCodes(name) : airportsPredicate;
            }

            // Find full or part of Destinations item's name
            predicate = predicate.Or(namePredicate).Or(splitedNamePredicate).Or(airportsPredicate);
            destinationPredicate = destinationPredicate.And(predicate);

            query = query.Where(destinationPredicate).OrderBy(item => item.SortOrder);

            if (showOnSearchPod)
            {
                query = query.Where(x => x.ShowOnSearchPod);
            }

            if (shouldGetItemsForAutocompleteOnly)
            {
                query = query.Where(x => x.ShowInAutocomplete);
            }

            return Search(query);
        }

        /// <inheritdoc/>
        public List<string> SpellCheck(string query, int maximumSuggestionCount)
        {
            logger.Info($@"Calling {nameof(SpellCheck)} with {nameof(query)}:'{query}'", this);

            var results = string.IsNullOrEmpty(query) ? null : Context.GetSpellCheck(null, new SpellCheckHandlerQueryOptions()
            {
                SpellCheck = new SpellCheckingParameters()
                {
                    Count = maximumSuggestionCount,
                    Build = true,
                    Query = query,
                }
            });

            if (results == null || results.SpellChecking == null || results.SpellChecking.Count < 1)
            {
                return new List<string>();
            }

            var suggestions = new List<string>();
            foreach (var term in results.SpellChecking)
            {
                foreach (var suggestion in term.Suggestions)
                {
                    suggestions.Add(suggestion);
                }
            }

            return suggestions;
        }

        /// <inheritdoc/>
        public SearchResults<BaseDestinationsSearchResultItem> SearchByNames(List<string> names, DestinationFilter destinationFilter = DestinationFilter.All)
        {
            logger.Info($@"Calling {nameof(SearchByNames)} with {nameof(names)}:'{string.Join(", ", names ?? new List<string>())}', {nameof(destinationFilter)}:'){destinationFilter}'", this);
            var query = Context.GetQueryable<BaseDestinationsSearchResultItem>();

            // Find full Destination item's
            var destinationPredicate = PredicateBuilder.True<BaseDestinationsSearchResultItem>();
            destinationPredicate = destinationPredicate.MatchDestinations(destinationFilter);

            var predicate = PredicateBuilder.False<BaseDestinationsSearchResultItem>();
            var namePredicate = PredicateBuilder.True<BaseDestinationsSearchResultItem>();

            // Find full Destination item's name
            foreach (var name in names)
            {
                namePredicate = namePredicate.Or(item => item.ItemName.Contains(name).Boost(1.5f));
            }

            // Find full or part of Destinations item's name
            predicate = predicate.Or(namePredicate);
            destinationPredicate = destinationPredicate.And(predicate);

            query = query.Where(destinationPredicate).OrderBy(item => item.SortOrder);

            return Search(query);
        }

        /// <inheritdoc/>
        public SearchResults<HotelFacilitiesSearchResultItem> SearchHotelsFacilitiesByIds(List<string> ids)
        {
            logger.Info($@"Calling {nameof(SearchHotelsFacilitiesByIds)} with {nameof(ids)}:'{string.Join(", ", ids ?? new List<string>())}'", this);
            // Find item by Accommodation template and select only necessary fields
            // and mapping fields to HotelFacilitiesSearchResultItem object
            var query = Context.GetQueryable<HotelFacilitiesSearchResultItem>()
            .Where(item => item.TemplateId == Constants.TemplateIds.Accommodation)

            // Returning only necessary field to increase performance
            .Select(item => new
            {
                item.SourceCodes,
                item.Name,
                item.FilteredFacilities,
                // item.IsLatestVersion,
                // item.Language
            })

            // Mapping anonymous object to HotelFacilitiesSearchResultItem
            .Select(item => new HotelFacilitiesSearchResultItem
            {
                SourceCodes = item.SourceCodes,
                Name = item.Name,
                FilteredFacilities = item.FilteredFacilities,
                // Language = item.Language,
                // IsLatestVersion = item.IsLatestVersion
            });

            var predicate = PredicateBuilder.True<HotelFacilitiesSearchResultItem>();
            foreach (var id in ids)
            {
                predicate = predicate.Or(item => item.SourceCodes.Contains(id));
            }

            query = query.Filter(predicate);

            return Search(query);
        }

        /// <inheritdoc/>
        public SearchResults<BaseDestinationsSearchResultItem> GetAllCountries(bool showOnSearchPod = false, bool shouldGetItemsForDropdownOnly = true)
        {
            logger.Info($@"Calling {nameof(SearchHotelsFacilitiesByIds)} with {nameof(showOnSearchPod)}:'{showOnSearchPod}', {nameof(shouldGetItemsForDropdownOnly)}:'{shouldGetItemsForDropdownOnly}'", this);
            var query = Context.GetQueryable<BaseDestinationsSearchResultItem>()
                .Where(item => item.TemplateId == Constants.TemplateIds.Country || item.TemplateId == Constants.TemplateIds.VirtualCountry);

            if (showOnSearchPod)
            {
                query = query.Where(x => x.ShowOnSearchPod);
            }

            if (shouldGetItemsForDropdownOnly)
            {
                query = query.Where(x => x.ShowOnDropdown);
            }

            query = query.OrderBy(x => x.DisplayName);

            return Search(query, orderByName: false);
        }

        /// <inheritdoc/>
        public SearchResults<BaseDestinationsSearchResultItem> GetDestinationsByAirportCodes(string[] codes)
        {
            logger.Debug($@"Calling {nameof(GetDestinationsByAirportCodes)} with {nameof(codes)}:'{string.Join(", ", codes ?? Array.Empty<string>())}'", this);
            var matchDestinationPredicate = PredicateBuilder.True<BaseDestinationsSearchResultItem>();
            matchDestinationPredicate = matchDestinationPredicate.MatchDestinations();

            var matchAirportCodesPredicate = PredicateBuilder.True<BaseDestinationsSearchResultItem>();
            if (codes != null)
            {
                foreach (var code in codes)
                {
                    matchAirportCodesPredicate = matchAirportCodesPredicate.Or(item => item.AirportCodes.Contains(code));
                }
            }

            matchDestinationPredicate = matchDestinationPredicate.And(matchAirportCodesPredicate);

            var query = Context.GetQueryable<BaseDestinationsSearchResultItem>()
                .Where(matchDestinationPredicate).SelectOnlyRequiredFields();

            return Search(query);
        }

        /// <inheritdoc/>
        public SearchResults<BaseDestinationsSearchResultItem> SearchByCodes(List<string> codes, bool includeRelatedItems = false, bool orderByName = true)
        {
            logger.Debug($@"Calling {nameof(SearchByCodes)} with {nameof(codes)}:'{string.Join(", ", codes ?? new List<string>())}'", this);
            var query = Context.GetQueryable<BaseDestinationsSearchResultItem>();

            var predicate = PredicateBuilder.True<BaseDestinationsSearchResultItem>();
            predicate = predicate.MatchDestinations();

            var destinationPredicate = PredicateBuilder.True<BaseDestinationsSearchResultItem>();
            if (codes != null)
            {
                foreach (var code in codes)
                {
                    destinationPredicate = destinationPredicate.Or(item => item.Code == code || item.SourceCodes.Contains(code) || item.GiataCode == code);
                }
            }

            predicate = predicate.And(destinationPredicate);

            query = query.Where(predicate);
            query = includeRelatedItems ? query.SelectOnlyRequiredFieldsWithRelatedData() : query.SelectOnlyRequiredFields();

            return Search(query, orderByName: orderByName);
        }

        /// <inheritdoc/>
        public IEnumerable<SearchHit<HotelSearchResultItem>> SearchHotelsByResortCodes(string[] codes, int batchSize = 1000)
        {
            logger.Info($@"Calling {nameof(SearchHotelsByResortCodes)} with {nameof(codes)}:'{string.Join(", ", codes ?? Array.Empty<string>())}'", this);
            var query = Context.GetQueryable<HotelSearchResultItem>().Where(item => item.TemplateId == Constants.TemplateIds.Accommodation);

            if (codes != null && codes.Any())
            {
                var predicate = PredicateBuilder.True<HotelSearchResultItem>();
                foreach (var code in codes)
                {
                    predicate = predicate.Or(item => item.HotelResort.Contains(code));
                }

                query = query.Filter(predicate);
            }

            return SearchAll(query, batchSize);
        }

        /// <inheritdoc/>
        public ID GetParentByHotelsCode(string code)
        {
            logger.Info($@"Calling {nameof(SearchByCodes)} with {nameof(code)}:'{code}'", this);
            var query = Context.GetQueryable<BaseDatasourceSearchResultItem>()
           .Where(item => item.TemplateId == Constants.TemplateIds.Accommodation);

            var predicate = PredicateBuilder.True<BaseDatasourceSearchResultItem>();
            predicate = predicate.Or(item => item.Code == code);

            query = query.Select(x => new { x.Parent }).Select(x => new BaseDatasourceSearchResultItem() { Parent = x.Parent });

            query = query.Filter(predicate);

            return Search(query).FirstOrDefault()?.Document.Parent;
        }

        /// <inheritdoc/>
        public SearchResults<SourcesSearchResultItem> GetAllExistHotelsCodes(string[] codes)
        {
            logger.Info($@"Calling {nameof(GetAllExistHotelsCodes)} with {nameof(codes)}:'{string.Join(", ", codes ?? Array.Empty<string>())}'", this);
            var query = Context.GetQueryable<SourcesSearchResultItem>()
            .Where(item => item.IsLatestVersion)
            .Where(item => item.TemplateId == Constants.TemplateIds.Accommodation);

            var predicate = PredicateBuilder.True<SourcesSearchResultItem>();
            foreach (var code in codes)
            {
                predicate = predicate.Or(item => item.SourceCodes.Contains(code));
            }

            query = query.Filter(predicate);

            return query.GetResults();
        }

        /// <inheritdoc/>
        public SearchResults<SourcesSearchResultItem> GetAllExistHotelsCodes()
        {
            logger.Info($@"Calling {nameof(GetAllExistHotelsCodes)}", this);
            var query = Context.GetQueryable<SourcesSearchResultItem>()
                .Where(item => item.TemplateId == Constants.TemplateIds.Accommodation)
                .Select(item => new
                {
                    item.SourceCodes,
                })
                .Select(item => new SourcesSearchResultItem
                {
                    SourceCodes = item.SourceCodes
                });

            return Search(query);
        }

        public SearchResults<HotelSearchResultItem> GetGiataToAccommodationCodesMapping(List<string> codes)
        {
            codes = codes ?? new List<string>();
            logger.Debug($@"Calling {nameof(GetGiataToAccommodationCodesMapping)} with {nameof(codes)}:'{string.Join(", ", codes)}'", this);
            var query = Context.GetQueryable<HotelSearchResultItem>()
                .Where(item => item.TemplateId == Constants.TemplateIds.Accommodation)
                .Select(item => new
                {
                    item.Code,
                    item.SourceCodes
                })
                .Select(item => new HotelSearchResultItem
                {
                    Code = item.Code,
                    SourceCodes = item.SourceCodes
                });

            var predicate = PredicateBuilder.True<HotelSearchResultItem>();
            foreach (var code in codes)
            {
                predicate = predicate.Or(item => item.SourceCodes.Contains(code));
            }

            query = query.Filter(predicate);
            return Search(query);
        }

        /// <inheritdoc/>
        public SearchResults<HotelSyncSearchResultItem> GetHotels(string startPath = "", int page = 1, int take = 0, bool shouldGetFirstVersion = false, bool orderByName = true)
        {
            logger.Debug($"Calling {nameof(GetHotels)} with {nameof(startPath)}: '{startPath}', {nameof(page)}: '{page}', {nameof(take)}: '{take}', {nameof(shouldGetFirstVersion)}: '{shouldGetFirstVersion}', {nameof(orderByName)}:'{orderByName}'", this);
            var query = Context.GetQueryable<HotelSyncSearchResultItem>()
                .Where(item => item.TemplateId == Constants.TemplateIds.Accommodation)
                // Restrict Solr field list (fl) to only required fields to avoid large responses
                .Select(item => new
                {
                    item.ItemName,
                    item.SourceCodes
                })
                // Map back to concrete type for SearchRepository.Search<T> compatibility
                .Select(item => new HotelSyncSearchResultItem
                {
                    ItemName = item.ItemName,
                    SourceCodes = item.SourceCodes
                });

            if (!string.IsNullOrWhiteSpace(startPath))
            {
                query = query.Where(item => item.Path.StartsWith(startPath));
            }

            return Search(query, page, take, shouldGetFirstVersion, orderByName);
        }

        /// <inheritdoc/>
        public SearchResults<HotelWithReviewSearchResultItem> GetHotelsWithReviews(string startPath, int page = 1, int take = 0)
        {
            logger.Info($@"Calling {nameof(GetHotelsWithReviews)} with {nameof(startPath)}:'{startPath}', {nameof(page)}:'{page}', {nameof(take)}:'{take}'", this);
            var query = Context.GetQueryable<HotelWithReviewSearchResultItem>()
                .Where(x => x.TemplateId == Constants.TemplateIds.Accommodation)
                .Select(item => new
                {
                    item.ItemName,
                    item.StarRating,
                    item.TotalNumberOfReviews,
                    item.HotelRating,
                    item.HotelUrl,
                    item.EcoFacility,
                    item.NormalaziedName
                })
                .Select(item => new HotelWithReviewSearchResultItem
                {
                    ItemName = item.ItemName,
                    StarRating = item.StarRating,
                    TotalNumberOfReviews = item.TotalNumberOfReviews,
                    HotelRating = item.HotelRating,
                    HotelUrl = item.HotelUrl,
                    EcoFacility = item.EcoFacility,
                    NormalaziedName = item.NormalaziedName
                });

            if (!string.IsNullOrWhiteSpace(startPath))
            {
                query = query.Where(item => item.Path.StartsWith(startPath));
            }

            query = query.OrderBy(x => x.NormalaziedName);

            return Search(query, page, take, orderByName: false);
        }

        public IEnumerable<SearchHit<HotelSyncSearchResultItem>> GetAllHotels(string startPath = "", int batchSize = 1000, bool shouldGetFirstVersion = false, bool orderByName = true)
        {
            logger.Info($@"Calling {nameof(GetAllHotels)} with {nameof(startPath)}:'{startPath}', {nameof(batchSize)}:'{batchSize}',{nameof(shouldGetFirstVersion)}:'{shouldGetFirstVersion}', {nameof(orderByName)}:'{orderByName}'", this);
            var query = Context.GetQueryable<HotelSyncSearchResultItem>()
                .Where(x => x.TemplateId == Constants.TemplateIds.Accommodation);

            if (!string.IsNullOrWhiteSpace(startPath))
            {
                query = query.Where(item => item.Path.StartsWith(startPath));
            }

            return SearchAll(query, batchSize, shouldGetFirstVersion, orderByName);
        }

        /// <inheritdoc/>
        public SearchResults<ItinerarySearchResultItem> SearchItinerary(List<string> codes)
        {
            logger.Info($@"Calling {nameof(SearchItinerary)} with {nameof(codes)}:'{string.Join(", ", codes ?? new List<string>())}'", this);
            var query = Context.GetQueryable<ItinerarySearchResultItem>()
                 .Where(item => item.TemplateId == Constants.TemplateIds.Location ||
                                item.TemplateId == Constants.TemplateIds.LocationCity ||
                                item.TemplateId == Constants.TemplateIds.Resort);

            var predicate = PredicateBuilder.True<ItinerarySearchResultItem>();
            foreach (var code in codes)
            {
                predicate = predicate.Or(item => item.Code == code);
            }

            query = query.Filter(predicate);
            return Search(query);
        }

        /// <inheritdoc/>
        public SearchResults<DestinationSearchResultItem> GetDestinationsByAirportCodes(DestinationByCodeQueryArgs args)
        {
            logger.Debug($@"Calling {nameof(GetDestinationsByAirportCodes)}", this);
            // EUXE-1140 allows user to search by non-latin character ex. 'Ä'
            var query = GetCultureQuery<DestinationSearchResultItem>(args.ShouldBeCultureSearch);

            var predicate = PredicateBuilder.False<DestinationSearchResultItem>();
            var queryPredicate = PredicateBuilder.True<DestinationSearchResultItem>();
            var tokensPredicate = PredicateBuilder.True<DestinationSearchResultItem>();
            var airportsPredicate = PredicateBuilder.True<DestinationSearchResultItem>();

            if (!string.IsNullOrWhiteSpace(args.Query))
            {
                queryPredicate = queryPredicate.And(item => item.ItemName.Equals(args.Query).Boost(1.5f));

                // EUXE-1140 allows user to search name field by non-latin character ex. 'Ä'
                tokensPredicate = args.ShouldBeCultureSearch ? tokensPredicate.BuildSearchQueryByName(args.Query) : tokensPredicate.BuildSearchQueryByDispayName(args.Query);

                // Include search by airport codes (EJH-9526)
                airportsPredicate = args.IncludeSearchByAirportCode ? airportsPredicate.IncludeSeachByAirportCodes(args.Query) : airportsPredicate;
            }

            var codesPredicate = PredicateBuilder.True<DestinationSearchResultItem>();
            foreach (var code in args.Codes)
            {
                codesPredicate = codesPredicate.Or(item => item.AirportCodes.Contains(code));
            }

            predicate = predicate.Or(queryPredicate).Or(tokensPredicate).Or(airportsPredicate);
            codesPredicate = codesPredicate.And(predicate).MatchDestinations(args.Filter);

            var queryWithoutSorting = query.Where(codesPredicate);
            query = queryWithoutSorting
                .OrderBy(item => item.SortOrder);

            if (args.ShouldGetItemsForDropdownOnly)
            {
                query = query.Where(x => x.ShowOnSearchPod);
                queryWithoutSorting = queryWithoutSorting.Where(x => x.ShowOnSearchPod);
            }

            if (args.ShouldGetItemsForAutocompleteOnly)
            {
                query = query.Where(x => x.ShowInAutocomplete);
                queryWithoutSorting = queryWithoutSorting.Where(x => x.ShowInAutocomplete);
            }

            var results = Search(query, take: args.Take);

            if (ShouldRerunWithoutSortingInternal(args.Take, results))
            {
                // Improve hotel search. For broad queries, if the first hit is already in the max sort order bucket,
                // ordering by SortOrder is no longer improving ranking.
                // Rerun without explicit sorting so Solr relevance score can decide top results.
                results = Search(queryWithoutSorting, take: args.Take, orderByName: false);
            }

            return results;
        }

        /// <summary>
        /// Get hotels Parent Item which has code supplied as parameter.
        /// </summary>
        /// <param name="code">Code of Parent Item.</param>
        /// <returns>ID of parent Item.</returns>
        public BaseDatasourceSearchResultItem GetDestinationItemByCode(string code)
        {
            logger.Info($@"Calling {nameof(GetDestinationItemByCode)} with {nameof(code)}:'{code}'", this);
            var query = Context.GetQueryable<BaseDatasourceSearchResultItem>()
                .Where(item => item.TemplateId == Constants.TemplateIds.Country ||
                        item.TemplateId == Constants.TemplateIds.Location ||
                        item.TemplateId == Constants.TemplateIds.LocationCity ||
                        item.TemplateId == Constants.TemplateIds.Resort ||
                        item.TemplateId == Constants.TemplateIds.VirtualRegion ||
                        item.TemplateId == Constants.TemplateIds.VirtualResort)
                .Select(item => new
                {
                    item.ItemId,
                    item.TemplateId,
                    item.Code
                })
                .Select(item => new BaseDatasourceSearchResultItem
                {
                    ItemId = item.ItemId,
                    TemplateId = item.TemplateId,
                    Code = item.Code
                });

            var predicate = PredicateBuilder.False<BaseDatasourceSearchResultItem>();
            predicate = predicate.Or(item => item.Code == code);

            query = query.Take(1).Filter(predicate);

            return Search(query).FirstOrDefault()?.Document;
        }

        /// <summary>
        /// Get hotels coordinates from Solr that are under Item which IDs are supplied as parameter and have Accomodation Template.
        /// </summary>
        /// <param name="hotelsParentItemIds">Collection of IDs of hotels' parent item.</param>
        /// <returns>Result array of <see cref="HotelSearchResultItem"/>.</returns>
        public SearchResults<HotelSearchResultItem> GetHotelsCoordinatesByHotelsParentsPath(ID[] hotelsParentItemIds)
        {
            logger.Info($@"Calling {nameof(SearchItinerary)} with {nameof(hotelsParentItemIds)}:'{string.Join(", ", hotelsParentItemIds?.ToList() ?? new List<ID>())}'", this);
            var query = Context.GetQueryable<HotelSearchResultItem>()
               .Where(item => item.TemplateId == Constants.TemplateIds.Accommodation);

            var predicate = PredicateBuilder.False<HotelSearchResultItem>();
            foreach (var hotelsParentItemId in hotelsParentItemIds)
            {
                predicate = predicate.Or(item => item.Paths.Contains(hotelsParentItemId));
            }

            query = query.Where(predicate);
            query = query.Select(item => new
            {
                item.SourceCodes,
                item.Name,
                item.Latitude,
                item.Longitude,
                item.Parent,
                item.Code
            }).Select(item => new HotelSearchResultItem
            {
                SourceCodes = item.SourceCodes,
                Name = item.Name,
                Latitude = item.Latitude,
                Longitude = item.Longitude,
                Parent = item.Parent,
                Code = item.Code
            });

            return Search(query);
        }

        /// <summary>
        /// Get hotels which coordinates are inside supplied polygon top left and bottom right angles.
        /// </summary>
        /// <param name="topLeftAngle">Top Left Angle of polygon.</param>
        /// <param name="bottomRightAngle">Bottom Right Angle of polygon.</param>
        /// <returns>Result array of <see cref="HotelSearchResultItem"/>.</returns>
        public SearchResults<HotelSearchResultItem> GetHotelsInsideCoordinateGrid(Point topLeftAngle, Point bottomRightAngle)
        {
            logger.Info($@"Calling {nameof(GetHotelsInsideCoordinateGrid)} with {nameof(topLeftAngle)}:'{topLeftAngle}', {nameof(bottomRightAngle)}:'{bottomRightAngle}'", this);
            var query = Context.GetQueryable<HotelSearchResultItem>()
                .Where(item => item.Latitude.Between(Math.Min(topLeftAngle.Latitude, bottomRightAngle.Latitude), Math.Max(topLeftAngle.Latitude, bottomRightAngle.Latitude), Inclusion.Both)
                    && item.Longitude.Between(Math.Min(topLeftAngle.Longitude, bottomRightAngle.Longitude), Math.Max(topLeftAngle.Longitude, bottomRightAngle.Longitude), Inclusion.Both)
                    && item.TemplateId == Constants.TemplateIds.Accommodation);

            return Search(query);
        }

        /// <inheritdoc/>
        public IEnumerable<string> GetHotelsCodes(int take, int page, DateTime? lastUpdated)
        {
            logger.Info($@"Calling {nameof(GetHotelsCodes)} with {nameof(take)}:'{take}', {nameof(page)}:'{page}', {nameof(lastUpdated)}:'{lastUpdated}'", this);
            var baseQuery = PredicateBuilder.True<SourcesSearchResultItem>();
            baseQuery = baseQuery.MatchContextLanguage();
            baseQuery = baseQuery.IsLatestVersion();

            var query = Context.GetQueryable<SourcesSearchResultItem>()
                .Where(item => item.TemplateId == Constants.TemplateIds.Accommodation);
            query = query.Filter(baseQuery);

            if (lastUpdated != null)
            {
                query = query.Where(item => item.LastUpdated >= lastUpdated);
            }

            if (take > 0 && page >= 0)
            {
                query = query.Page(page, take);
            }

            var codeFieldQuery = query.Select(item => new
            {
                item.SourceCodes
            });

            return codeFieldQuery.GetResults().SelectMany(x => x.Document.SourceCodes ?? Enumerable.Empty<string>()).Where(x => !string.IsNullOrEmpty(x));
        }

        /// <inheritdoc/>
        public string GetDestinationCodeByName(string name)
        {
            logger.Info($@"Calling {nameof(GetDestinationCodeByName)} with {nameof(name)}:'{name}'", this);
            var query = Context.GetQueryable<BaseDatasourceSearchResultItem>()
                .Where(item => (item.TemplateId == Constants.TemplateIds.Country).Boost(3) ||
                        (item.TemplateId == Constants.TemplateIds.Location).Boost(2) ||
                        (item.TemplateId == Constants.TemplateIds.LocationCity).Boost(2) ||
                        (item.TemplateId == Constants.TemplateIds.Resort).Boost(1))
                .Select(item => item.Code).Select(item => new BaseDatasourceSearchResultItem() { Code = item });

            var predicate = PredicateBuilder.True<BaseDatasourceSearchResultItem>();
            predicate = predicate.And(item => item.ItemName == name);
            predicate = predicate.MatchContextLanguage();
            predicate = predicate.IsLatestVersion();
            query = query.Where(predicate).Take(1);

            return query.GetResults().FirstOrDefault()?.Document.Code;
        }

        /// <inheritdoc/>
        public HotelResortSearchResultItem GetAccommodationResortInfoByAccommodationCode(string code)
        {
            logger.Info($@"Calling {nameof(GetAccommodationResortInfoByAccommodationCode)} with {nameof(code)}:'{code}'", this);
            var query = Context.GetQueryable<HotelResortSearchResultItem>()
                .Where(item => item.TemplateId == Constants.TemplateIds.Accommodation && item.SourceCodes.Contains(code))
                .Select(item => new
                {
                    item.ResortImageUrl,
                    item.ResortDescription
                })
                .Select(item => new HotelResortSearchResultItem
                {
                    ResortImageUrl = item.ResortImageUrl,
                    ResortDescription = item.ResortDescription
                }).Take(1);

            return Search(query).FirstOrDefault()?.Document;
        }

        /// <inheritdoc/>
        public HotelHighlightsSearchResultItem GetHotelHighlightsByAccommodationCode(string code)
        {
            logger.Info($@"Calling {nameof(GetHotelHighlightsByAccommodationCode)} with {nameof(code)}:'{code}'", this);
            var query = Context.GetQueryable<HotelHighlightsSearchResultItem>()
                .Where(item => item.TemplateId == Constants.TemplateIds.Accommodation && item.SourceCodes.Contains(code))
                .Select(item => new
                {
                    item.HotelHighlights,
                })
                .Select(item => new HotelHighlightsSearchResultItem()
                {
                    HotelHighlights = item.HotelHighlights,
                }).Take(1);

            return Search(query).FirstOrDefault()?.Document;
        }

        /// <inheritdoc/>
        public PromoFacilitiesSearchResultItem GetPromoFacilities(string hotelCode)
        {
            logger.Info($@"Calling {nameof(GetPromoFacilities)} with {nameof(hotelCode)}:'{hotelCode}'", this);
            var query = Context.GetQueryable<PromoFacilitiesSearchResultItem>()
                .Where(item => item.TemplateId == Constants.TemplateIds.Accommodation && item.SourceCodes.Contains(hotelCode))
                // Returning only necessary field to increase performance
                .Select(item => new
                {
                    item.PromoFacilities
                })
                // Mapping anonymous object to PromoFacilitiesSearchResultItem
                .Select(item => new PromoFacilitiesSearchResultItem
                {
                    PromoFacilities = item.PromoFacilities
                }).Take(1);

            return Search(query).FirstOrDefault()?.Document;
        }

        /// <inheritdoc/>
        public SearchResults<DestinationSearchResultItem> GetDestinationsByCodes(List<string> hotelCodes, List<string> giataCodes, string forceIndexName = null)
        {
            logger.Info($@"Calling {nameof(GetDestinationsByCodes)} with {nameof(hotelCodes)}:'{string.Join(", ", hotelCodes ?? new List<string>())}', {nameof(giataCodes)}:'{string.Join(", ", giataCodes ?? new List<string>())}', {nameof(forceIndexName)}:'{forceIndexName}'", this);
            var query = Context.GetQueryable<DestinationSearchResultItem>();

            var destinationPredicate = PredicateBuilder.True<DestinationSearchResultItem>();
            destinationPredicate = destinationPredicate.MatchDestinations();

            var predicate = PredicateBuilder.True<DestinationSearchResultItem>();
            foreach (var code in hotelCodes)
            {
                predicate = predicate.Or(item => item.SourceCodes.Contains(code));
            }

            foreach (var code in giataCodes)
            {
                predicate = predicate.Or(item => item.GiataCode == code);
            }

            query = query.Where(destinationPredicate);
            query = query.Filter(predicate);

            if (!string.IsNullOrWhiteSpace(forceIndexName))
            {
                try
                {
                    var index = ContentSearchManager.GetIndex(forceIndexName);
                    Context = index.CreateSearchContext();
                }
                catch (Exception)
                {
                    // Nothing here. Default index will be used in this case.
                }
            }

            return Search(query);
        }

        /// <inheritdoc />
        public SearchResults<BaseHotelSearchResultItem> GetHotelsByGiataCodes(List<string> giataCodes)
        {
            logger.Info($@"Calling {nameof(GetHotelsByGiataCodes)} with {nameof(giataCodes)}:'{string.Join(", ", giataCodes ?? new List<string>())}'", this);
            var query = Context.GetQueryable<BaseHotelSearchResultItem>();

            var predicate = PredicateBuilder.True<BaseHotelSearchResultItem>();
            if (giataCodes != null)
            {
                foreach (var code in giataCodes)
                {
                    predicate = predicate.Or(item => item.GiataCode == code);
                }
            }

            query = query.Filter(predicate);

            return Search(query);
        }

        public SearchResults<BaseDatasourceSearchResultItem> GetAllRegions()
        {
            logger.Info($@"Calling {nameof(GetAllRegions)}", this);
            var query = Context.GetQueryable<BaseDatasourceSearchResultItem>()
                .Where(item => item.TemplateId == Constants.TemplateIds.RegionPage || item.TemplateId == Constants.TemplateIds.RegionCityPage || item.TemplateId == Constants.TemplateIds.VirtualRegion);

            return Search(query);
        }

        protected internal virtual bool ShouldRerunWithoutSortingInternal(int take, SearchResults<DestinationSearchResultItem> results)
            => results != null &&
                take > 0 &&
                results.TotalSearchResults > take &&
                results.FirstOrDefault()?.Document?.SortOrder == DestinationSortOrderComputedField.MaxSortOrder;

        /// <summary>
        /// Get culture context query.
        /// </summary>
        /// <typeparam name="T">Search Result Item type.</typeparam>
        /// <returns>Culture context query.</returns>
        private IQueryable<T> GetCultureQuery<T>(bool shouldBeCulture)
            where T : SearchResultItem
        {
            var cultureInfo = Sitecore.Context.Language?.CultureInfo;
            if (shouldBeCulture && cultureInfo != null)
            {
                return Context.GetQueryable<T>(new CultureExecutionContext(cultureInfo));
            }

            return Context.GetQueryable<T>();
        }
    }
}
