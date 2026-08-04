using System;
using System.Linq;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.SitecoreExtensions.ContentSearch.Repositories;
using easyJet.Foundation.SitecoreExtensions.Services;
using easyJet.Foundation.Voucherify.ContentSearch.SearchTypes;
using easyJet.Foundation.Voucherify.ContentSearch.Settings;
using Sitecore.Data.Items;
using Sitecore.Globalization;

namespace easyJet.Foundation.Voucherify.ContentSearch.Repositories
{
    [Service(typeof(IPromotionRepository), Lifetime = Lifetime.Transient)]
    public class PromotionRepository : SearchRepository, IPromotionRepository
    {
        private readonly IDatabaseProvider databaseProvider;

        public PromotionRepository(IDatabaseProvider databaseProvider, IPromotionSearchSetting indexSettings)
            : base(indexSettings)
        {
            this.databaseProvider = databaseProvider;
        }

        /// <inheritdoc/>
        public Item[] GetAll(string marketCode)
        {
            var query = Context.GetQueryable<PromotionSearchResultItem>()
               .Where(x => x.TemplateId == Templates.Promotion.Id);

            if (!string.IsNullOrEmpty(marketCode))
            {
                query = query.Where(x => x.MarketCodes.Contains(marketCode));
            }

            var items = Search(query, shouldSearchInContextSite: true);
            if (items == null || items.TotalSearchResults == 0)
            {
                return null;
            }

            return items.OrderBy(x => x.Document.SortOrder)
                .ThenBy(x => x.Document.Name)
                .Select(x => databaseProvider.GetItem(x.Document.Uri))
                .ToArray();
        }

        /// <inheritdoc/>
        public Item GetPromotionByAtcomCode(string atcomCode, string marketCode)
        {
            var query = Context.GetQueryable<PromotionSearchResultItem>()
               .Where(x => x.TemplateId == Templates.Promotion.Id)
               .Where(x => x.PromotionCodes.Contains(atcomCode));

            if (!string.IsNullOrEmpty(marketCode))
            {
                query = query.Where(x => x.MarketCodes.Contains(marketCode));
            }

            var items = Search(query, shouldSearchInContextSite: true);
            if (items == null || items.TotalSearchResults == 0)
            {
                return null;
            }

            return databaseProvider.GetItem(items
                    .OrderBy(x => x.Document.SortOrder)
                    .ThenBy(x => x.Document.Name)
                    .FirstOrDefault()?.Document.Uri);
        }

        /// <inheritdoc/>
        public Item[] GetPromotions(string promoCode, string marketCode, Language lang)
        {
            var query = Context.GetQueryable<PromotionSearchResultItem>()
                .Where(x => x.TemplateId == Templates.Promotion.Id)
                .Where(x => x.CustomerPromoCode == promoCode);

            if (!string.IsNullOrEmpty(marketCode))
            {
                query = query.Where(x => x.MarketCodes.Contains(marketCode));
            }

            var items = Search(query, shouldSearchInContextLang: false, shouldSearchInContextSite: true);
            if (items == null || items.TotalSearchResults == 0)
            {
                return Array.Empty<Item>();
            }

            return items
                .OrderBy(x => x.Document.SortOrder)
                .ThenBy(x => x.Document.Name)
                .Select(x => databaseProvider.GetItem(x.Document.Uri, lang))
                .ToArray();
        }
    }
}