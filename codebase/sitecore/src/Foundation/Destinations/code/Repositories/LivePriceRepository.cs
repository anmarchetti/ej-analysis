using System;
using System.Collections.Generic;
using System.Linq;
using System.Xml.Linq;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Multisite;
using easyJet.Foundation.Multisite.Models;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using easyJet.Foundation.SitecoreExtensions.Utils;
using Sitecore.Data;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Repositories
{
    [Service(typeof(ILivePriceRepository), Lifetime = Lifetime.Singleton)]
    public class LivePriceRepository : ILivePriceRepository
    {
        private readonly IHtmlCacheRepository cache;

        /// <summary>
        /// Initializes a new instance of the <see cref="LivePriceRepository"/> class.
        /// </summary>
        /// <param name="cache">HTML cache.</param>
        public LivePriceRepository(IHtmlCacheRepository cache)
        {
            this.cache = cache;
        }

        /// <inheritdoc />
        public IEnumerable<NamedSearchItem> GetLivePriceSettings(string marketCode)
        {
            return cache.GetOrAdd($"Destinations.Cache.{Constants.TemplateIds.NamedSearchFolder}.{marketCode}", () =>
            {
                var livePriceFolder = Sitecore.Context.Database.SelectSingleItem($"{Sitecore.Context.Site.RootPath}/Data/*[@@templateId='{Constants.TemplateIds.LivePriceFolder}']");
                if (livePriceFolder == null)
                {
                    return Enumerable.Empty<NamedSearchItem>();
                }

                var livePriceMarketFolder = livePriceFolder?.Children
                    .Where(x => x.TemplateID == Constants.TemplateIds.NamedSearchFolder)
                    .FirstOrDefault(item =>
                    {
                        var marketItem = FieldUtils.GetReferenceTargetItem(Multisite.Templates.MarketSettings.Fields.Market, item);
                        if (marketItem == null)
                        {
                            return false;
                        }

                        return marketItem?.Fields[Templates.Market.Fields.Code]?.Value == marketCode;
                    });

                if (livePriceMarketFolder == null)
                {
                    return Enumerable.Empty<NamedSearchItem>();
                }

                return livePriceMarketFolder.Children.Select(MapNamedSearchItem).ToList();
            });
        }

        private NamedSearchItem MapNamedSearchItem(Item namedSearchItem)
        {
            return new NamedSearchItem(namedSearchItem);
        }
    }
}