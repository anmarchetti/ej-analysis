using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Destinations.ContentSearch.Repositories;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using easyJet.Foundation.Destinations.ContentSearch.Settings;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.SitecoreExtensions.Services;
using easyJet.Foundation.SitecoreExtensions.Switchers;
using Sitecore.ContentSearch.Linq;
using Sitecore.ContentSearch.Linq.Utilities;
using Sitecore.Data;
using Sitecore.Data.Events;
using Sitecore.Data.Items;
using Sitecore.SecurityModel;
using static easyJet.Foundation.Destinations.Constants.Fields;

namespace easyJet.Foundation.Destinations.Repositories
{
    /// <summary>
    /// Represents DatasourceRepository based on Search.
    /// </summary>
    [Service(typeof(ISearchDatasourceRepository), Lifetime = Lifetime.Transient)]
    public class SearchDatasourceRepository : SearchRepository, ISearchDatasourceRepository
    {
        private readonly IDatabaseProvider databaseProvider;

        public SearchDatasourceRepository(IDatabaseProvider databaseProvider, IDestinationSearchSettings indexSettings, IDestinationsLogger logger)
            : base(indexSettings, logger)
        {
            this.databaseProvider = databaseProvider;
        }

        /// <summary>
        /// Tries to get Item by code using search
        /// Returns found item or creates new one.
        /// </summary>
        /// <param name="name">Item's name.</param>
        /// <param name="code">Item's code.</param>
        /// <param name="templateId">Item's template ID.</param>
        /// <param name="parent">Item's parent.</param>
        /// <param name="itemCreated">Determinates if an item has been created</param>
        /// <param name="disableEvents">Determinates should events be disabled or not.</param>
        /// <returns>Item's object.</returns>
        public Item GetOrCreateItem(string name, string code, ID templateId, Item parent, out bool itemCreated, bool disableEvents = false)
        {
            using (new LogSwitcher(logger))
            {
                logger.Info($@"Calling {nameof(GetOrCreateItem)} with  {nameof(name)}:'{name}', {nameof(code)}:'{code}', {nameof(templateId)}:'{templateId}' {nameof(parent)}:'{parent?.Paths.Path}', {nameof(disableEvents)}:'{disableEvents}'", this);
                using (new SecurityDisabler())
                {
                    var item = GetItemByCode(code, templateId, false);

                    if (item != null)
                    {
                        logger.Info($"{nameof(item)} already exists {nameof(item)}:{item?.Paths.Path}", this);
                        itemCreated = false;
                        return item;
                    }

                    itemCreated = true;
                    var itemName = ItemUtil.ProposeValidItemName(name);

                    logger.Info($@"Creating Item {nameof(itemName)}:'{itemName}'", this);
                    if (disableEvents)
                    {
                        using (new EventDisabler())
                        {
                            return parent.Add(itemName, new TemplateID(templateId));
                        }
                    }

                    return parent.Add(itemName, new TemplateID(templateId));
                }
            }
        }

        /// <inheritdoc />
        public Item GetItemByCode(string code, ID templateId, bool shouldGetFirstVersion = true)
        {
            using (new LogSwitcher(logger))
            {
                logger.Info($@"Calling {nameof(GetItemByCode)} with  {nameof(code)}:'{code}', {nameof(templateId)}:'{templateId}' {nameof(shouldGetFirstVersion)}:'{shouldGetFirstVersion}'", this);

                if (string.IsNullOrWhiteSpace(code))
                {
                    return null;
                }

                var query = Context.GetQueryable<BaseDatasourceSearchResultItem>()
                    .Where(item => item.TemplateId == templateId)
                    .Where(item => item.Code == code || item.SourceCodes.Contains(code));

                return databaseProvider.GetItem(Search(query, shouldGetFirstVersion: shouldGetFirstVersion)?.FirstOrDefault()?.Document.Uri);
            }
        }

        public IEnumerable<Item> GetAllItemsByCodes(List<string> codes, ID templateId)
        {
            using (new LogSwitcher(logger))
            {
                logger.Info(
                    $@"Calling {nameof(GetAllItemsByCodes)} with {nameof(codes)}:'{string.Join("', '", codes ?? new List<string>())}', {nameof(templateId)}:'{templateId}'",
                    this);

                var codesList = codes?
                    .Where(x => !string.IsNullOrWhiteSpace(x))
                    .Select(x => x.Trim())
                    .Distinct(StringComparer.InvariantCultureIgnoreCase)
                    .ToList();

                if (codesList == null || !codesList.Any())
                {
                    return Enumerable.Empty<Item>();
                }

                var query = Context.GetQueryable<BaseDatasourceSearchResultItem>()
                    .Where(item => item.TemplateId == templateId);

                var predicate = PredicateBuilder.False<BaseDatasourceSearchResultItem>();

                foreach (var code in codesList)
                {
                    var localCode = code;
                    predicate = predicate.Or(item => item.Code == localCode);
                }

                query = query.Filter(predicate);

                return Search(query)
                    .Select(x => x.Document)
                    .Select(x => databaseProvider.GetItem(x.Uri))
                    .Where(x => x != null)
                    .ToList();
            }
        }

        /// <inheritdoc />
        public Dictionary<string, Item> GetItemsByCodes(List<string> codes, ID templateId)
        {
            using (new LogSwitcher(logger))
            {
                logger.Info($@"Calling {nameof(GetItemsByCodes)} with {nameof(codes)}:'{string.Join("', '", codes ?? new List<string>())}', {nameof(templateId)}:'{templateId}'", this);
                var codesList = codes?.ToList();
                if (codesList == null || !codesList.Any())
                {
                    return new Dictionary<string, Item>();
                }

                var query = Context.GetQueryable<BaseDatasourceSearchResultItem>()
                    .Where(item => item.TemplateId == templateId);

                var predicate = PredicateBuilder.True<BaseDatasourceSearchResultItem>();
                foreach (var code in codesList)
                {
                    predicate = predicate.Or(item => item.Code == code);
                }

                query = query.Filter(predicate);

                return Search(query).Select(x => x.Document).GroupBy(x => x.Code).ToDictionary(x => x.Key, y => databaseProvider.GetItem(y.First().Uri));
            }
        }

        public Dictionary<string, Item> GetItemsByTemplate(ID templateId)
        {
            using (new LogSwitcher(logger))
            {
                logger.Info($@"Calling {nameof(GetItemsByTemplate)} with {nameof(templateId)}:'{templateId}'", this);
                var query = Context.GetQueryable<BaseDatasourceSearchResultItem>().Where(item => item.TemplateId == templateId);
                return Search(query).Select(x => x.Document).Where(i => !string.IsNullOrWhiteSpace(i.Code)).GroupBy(x => x.Code).ToDictionary(x => x.Key, y => databaseProvider.GetItem(y.First().Uri));
            }
        }

        /// <inheritdoc />
        public Dictionary<string, ID> GetItemIdsByCodes(List<string> codes, ID templateId)
        {
            using (new LogSwitcher(logger))
            {
                logger.Info($@"Calling {nameof(GetItemIdsByCodes)} with {nameof(codes)}:'{string.Join("', '", codes ?? new List<string>())}', {nameof(templateId)}:'{templateId}'", this);
                var query = Context.GetQueryable<BaseDatasourceSearchResultItem>()
                    .Where(item => item.TemplateId == templateId)
                    .Select(item => new { item.ItemId, item.Code })
                    .Select(
                        item => new BaseDatasourceSearchResultItem()
                        {
                            Code = item.Code,
                            ItemId = item.ItemId
                        });

                if (codes != null && codes.Any())
                {
                    var predicate = PredicateBuilder.True<BaseDatasourceSearchResultItem>();
                    foreach (var code in codes)
                    {
                        predicate = predicate.Or(item => item.Code.Equals(code));
                    }

                    query = query.Filter(predicate);
                }

                return Search(query).Select(x => x.Document).GroupBy(x => x.Code).ToDictionary(x => x.Key, y => y.First().ItemId);
            }
        }
    }
}