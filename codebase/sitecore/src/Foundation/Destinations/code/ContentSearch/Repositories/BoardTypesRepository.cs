using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using easyJet.Foundation.Destinations.ContentSearch.Settings;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Multisite;
using Sitecore.Configuration;
using Sitecore.ContentSearch.Linq;
using Sitecore.ContentSearch.Linq.Utilities;
using Sitecore.Data.Items;
using static easyJet.Foundation.Destinations.Constants.Acmi.Messages;

namespace easyJet.Foundation.Destinations.ContentSearch.Repositories
{
    /// <summary>
    /// Represents Search logic for Board Types items.
    /// </summary>
    [Service(typeof(IBoardTypesRepository), Lifetime = Lifetime.Transient)]
    public class BoardTypesRepository : SearchRepository, IBoardTypesRepository
    {
        public BoardTypesRepository(IDestinationSearchSettings indexSettings, IDestinationsLogger logger)
            : base(indexSettings, logger)
        {
        }

        /// <summary>
        /// Get Board Types from Solr by provided <paramref name="codes"/>.
        /// </summary>
        /// <param name="codes">Collection of codes.</param>
        /// <returns>Search Results collection of <see cref="BaseDatasourceSearchResultItem"/>.</returns>
        public SearchResults<BaseDatasourceSearchResultItem> SearchByCodes(string[] codes)
        {
            logger.Info($@"Calling {nameof(SearchByCodes)} with {nameof(codes)}:'{string.Join(", ", codes ?? Array.Empty<string>())}'", this);
            var query = Context.GetQueryable<BaseDatasourceSearchResultItem>()
                .Where(item => item.TemplateId == Constants.TemplateIds.BoardType);

            var predicate = PredicateBuilder.True<BaseDatasourceSearchResultItem>();
            foreach (var code in codes)
            {
                predicate = predicate.Or(item => item.Code == code);
            }

            query = query.Filter(predicate);
            return Search(query);
        }

        /// <inheritdoc />
        public IEnumerable<Item> GetAllBoardTypeItems(string databaseName = "")
        {
            logger.Info($@"Calling {nameof(GetAllBoardTypeItems)} with {nameof(databaseName)}:'{databaseName}'", this);
            var database = !string.IsNullOrWhiteSpace(databaseName) ? Factory.GetDatabase(databaseName) : Sitecore.Context.Database;
            return database
                .SelectItems($"{Sitecore.Context.Site.RootPath}" +
                $"/*[@@templateid ='{Templates.Data.Id}']" +
                $"/*[@@templateid ='{Constants.TemplateIds.BoardTypesFolder}']" +
                $"/*[@@templateid = '{Constants.TemplateIds.BoardType}']")?
                .OrderBy(boardTypeItem => boardTypeItem.Name);
        }
    }
}