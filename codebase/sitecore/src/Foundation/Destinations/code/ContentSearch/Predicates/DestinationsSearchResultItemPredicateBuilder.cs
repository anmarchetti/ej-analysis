using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using easyJet.Foundation.Destinations.Models;
using easyJet.Foundation.SitecoreExtensions.ContentSearch.BaseSearchTypes;
using EasyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore.ContentSearch.Linq;
using Sitecore.ContentSearch.Linq.Utilities;
using Sitecore.Data;

namespace easyJet.Foundation.Destinations.ContentSearch.Predicates
{
    public static class DestinationsSearchResultItemPredicateBuilder
    {
        private static readonly Dictionary<DestinationFilter, List<ID>> FlagsTemplateIdsMapper = new Dictionary<DestinationFilter, List<ID>>
            {
                { DestinationFilter.Country, new List<ID> { Constants.TemplateIds.Country } },
                { DestinationFilter.Region, new List<ID> { Constants.TemplateIds.Location, Constants.TemplateIds.LocationCity } },
                { DestinationFilter.Resort, new List<ID> { Constants.TemplateIds.Resort } },
                { DestinationFilter.Accommodation, new List<ID> { Constants.TemplateIds.Accommodation } },
                { DestinationFilter.VirtualCountry, new List<ID> { Constants.TemplateIds.VirtualCountry } },
                { DestinationFilter.VirtualRegion, new List<ID> { Constants.TemplateIds.VirtualRegion } },
                { DestinationFilter.VirtualResort, new List<ID> { Constants.TemplateIds.VirtualResort } }
            };

        public static IQueryable<SearchTypes.BaseDestinationsSearchResultItem> SelectOnlyRequiredFields(this IQueryable<SearchTypes.BaseDestinationsSearchResultItem> query)
        {
            return query
                // Returning only necessary field to increase performance
                .Select(x => new
                {
                    x.ItemId,
                    x.ItemName,
                    x.Code,
                    x.SourceCodes,
                    x.GiataCode,
                    x.TemplateName,
                    x.AirportCodes,
                    x.ImageUrl,
                    x.IsLatestVersion,
                    x.Language,
                    x.ShowOnSearchPod,
                    x.MuzementId,
                    x.TrackingId
                })

                // Mapping anonymous object to BaseDestinationsSearchResultItem
                .Select(x => new SearchTypes.BaseDestinationsSearchResultItem
                {
                    ItemId = x.ItemId,
                    ItemName = x.ItemName,
                    Code = x.Code,
                    GiataCode = x.GiataCode,
                    TemplateName = x.TemplateName,
                    AirportCodes = x.AirportCodes,
                    ImageUrl = x.ImageUrl,
                    IsLatestVersion = x.IsLatestVersion,
                    Language = x.Language,
                    ShowOnSearchPod = x.ShowOnSearchPod,
                    MuzementId = x.MuzementId,
                    SourceCodes = x.SourceCodes,
                    TrackingId = x.TrackingId
                });
        }

        public static IQueryable<SearchTypes.BaseDestinationsSearchResultItem> SelectOnlyRequiredFieldsWithRelatedData(this IQueryable<SearchTypes.BaseDestinationsSearchResultItem> query)
        {
            return query
                // Returning only necessary field to increase performance
                .Select(x => new
                {
                    x.ItemId,
                    x.ItemName,
                    x.Code,
                    x.TemplateName,
                    x.AirportCodes,
                    x.ImageUrl,
                    x.IsLatestVersion,
                    x.Language,
                    x.Parents,
                    x.Children,
                    x.ShowOnSearchPod,
                    x.RelatedRegions,
                    x.RelatedResorts,
                    x.MuzementId,
                    x.GiataCode,
                    x.SourceCodes,
                    x.TrackingId,
                })

                // Mapping anonymous object to BaseDestinationsSearchResultItem
                .Select(x => new SearchTypes.BaseDestinationsSearchResultItem
                {
                    ItemId = x.ItemId,
                    ItemName = x.ItemName,
                    Code = x.Code,
                    TemplateName = x.TemplateName,
                    AirportCodes = x.AirportCodes,
                    ImageUrl = x.ImageUrl,
                    IsLatestVersion = x.IsLatestVersion,
                    Language = x.Language,
                    Parents = x.Parents,
                    Children = x.Children,
                    ShowOnSearchPod = x.ShowOnSearchPod,
                    RelatedRegions = x.RelatedRegions,
                    RelatedResorts = x.RelatedResorts,
                    MuzementId = x.MuzementId,
                    GiataCode = x.GiataCode,
                    SourceCodes = x.SourceCodes,
                    TrackingId = x.TrackingId
                });
        }

        /// <summary>
        /// Create predicate based on template ids by filter flags and add to supplied predicate.
        /// </summary>
        /// <typeparam name="T">Type of searched result.</typeparam>
        /// <param name="exp">Predicate to extend.</param>
        /// <param name="filter">Filter to filter templates.</param>
        /// <returns>Modified exp predicate with predicate based on template ids.</returns>
        public static Expression<Func<T, bool>> MatchDestinations<T>(this Expression<Func<T, bool>> exp, DestinationFilter filter = DestinationFilter.All)
            where T : BaseSearchResultItem
        {
            var predicate = PredicateBuilder.True<T>();

            if (filter == DestinationFilter.All)
            {
                FlagsTemplateIdsMapper.ToList().ForEach(x => x.Value.ToList().ForEach(value => predicate = predicate.Or(item => item.TemplateId == value)));
            }
            else
            {
                FlagsTemplateIdsMapper.Where(x => filter.HasFlag(x.Key)).ToList().ForEach(x => x.Value.ToList().ForEach(value => predicate = predicate.Or(item => item.TemplateId == value)));
            }

            return exp.And(predicate);
        }

        /// <summary>
        /// Create predicate to search destinations (Country, Region) by airport codes.
        /// </summary>
        /// <typeparam name="T">Type of searched result.</typeparam>
        /// <param name="exp">Predicate to extend.</param>
        /// <param name="airportCode">Airport code.</param>
        /// <returns>Modified exp predicate with predicate based on destinations that included provided airport code.</returns>
        public static Expression<Func<T, bool>> IncludeSeachByAirportCodes<T>(this Expression<Func<T, bool>> exp, string airportCode)
            where T : DestinationSearchResultItem
        {
            var predicate = PredicateBuilder.True<T>();
            airportCode = airportCode.ToUpper();

            predicate = predicate.And(item => item.AirportCodes.Contains(airportCode).Boost(4f));
            predicate = predicate.MatchDestinations(DestinationFilter.Region);
            return exp.Or(predicate);
        }

        /// <summary>
        /// Allows user to search name field by non-latin character ex. 'Ä'.
        /// </summary>
        /// <param name="exp">Predicate to extend.</param>
        /// <param name="query">Query string.</param>
        /// <returns>Modified exp predicate with predicate based on destinations that included search by 'Name' field.</returns>
        public static Expression<Func<DestinationSearchResultItem, bool>> BuildSearchQueryByName(this Expression<Func<DestinationSearchResultItem, bool>> exp, string query)
        {
            var tokensPredicate = PredicateBuilder.True<DestinationSearchResultItem>();

            var tokens = query.Split(' ');

            for (int i = 0; i < tokens.Length - 1; i++)
            {
                string token = tokens[i];
                tokensPredicate = tokensPredicate.And(item => item.ItemName.Equals(token));
            }

            string lastToken = tokens[tokens.Length - 1].ToWildcard();
            if (!string.IsNullOrEmpty(lastToken))
            {
                tokensPredicate = tokensPredicate.And(item => item.ItemName.MatchWildcard(lastToken));
            }

            return exp.And(tokensPredicate);
        }

        /// <summary>
        /// Build query by transliterated display name or normalazied name.
        /// </summary>
        /// <param name="exp">Predicate to extend.</param>
        /// <param name="query">Query string.</param>
        /// <returns>Modified exp predicate with predicate based on destinations that included search by 'Display Name' and NormalaziedName fields.</returns>
        public static Expression<Func<DestinationSearchResultItem, bool>> BuildSearchQueryByDispayName(this Expression<Func<DestinationSearchResultItem, bool>> exp, string query)
        {
            var dispayNamePredicate = PredicateBuilder.True<DestinationSearchResultItem>();
            var normalaziedNamePredicate = PredicateBuilder.True<DestinationSearchResultItem>();
            var namePredicate = PredicateBuilder.True<DestinationSearchResultItem>();

            var tokens = query.Split(' ');

            foreach (var token in tokens)
            {
                var wildCardToken = token.ToWildcard();
                if (!string.IsNullOrEmpty(wildCardToken))
                {
                    dispayNamePredicate = dispayNamePredicate.And(item => item.DisplayName.MatchWildcard(wildCardToken));
                    normalaziedNamePredicate = normalaziedNamePredicate.And(item => item.NormalaziedName.MatchWildcard(wildCardToken));
                }
            }

            namePredicate = namePredicate.Or(dispayNamePredicate).Or(normalaziedNamePredicate);

            return exp.And(namePredicate);
        }
    }
}