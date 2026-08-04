using System.Collections.Generic;
using System.Linq;
using System.Runtime.CompilerServices;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Multisite.Logging;
using easyJet.Foundation.Multisite.Models;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using easyJet.Foundation.SitecoreExtensions.Utils;
using Sitecore;
using Sitecore.Data.Items;

[assembly: InternalsVisibleTo("easyJet.Foundation.Multisite.Tests")]
[assembly: InternalsVisibleTo("DynamicProxyGenAssembly2")]

namespace easyJet.Foundation.Multisite.Services
{
    [Service(typeof(IMarketSettingsService), Lifetime = Lifetime.Singleton)]
    public class MarketSettingsService : IMarketSettingsService
    {
        private readonly IHtmlCacheRepository cache;
        private readonly IMultisiteLogger logger;

        public MarketSettingsService(IHtmlCacheRepository cache, IMultisiteLogger logger)
        {
            this.cache = cache;
            this.logger = logger;
        }

        /// <summary>
        /// Gets current market based on current context and language.
        /// </summary>
        /// <returns></returns>
        public MarketSettings GetCurrentMarket()
        {
            var currentLanguage = Context.Language.Name;

            var markets = GetAllMarkets();

            if (markets.ContainsKey(currentLanguage))
            {
                return markets[currentLanguage];
            }

            return null;
        }

        /// <summary>
        /// Gets language based markets.
        /// </summary>
        /// <returns>Collection of markets per language.</returns>
        public Dictionary<string, MarketSettings> GetAllMarkets()
        {
            const string cacheKey = "Multisite.Cache.MarketSettings";
            var data = cache.GetItem<Dictionary<string, MarketSettings>>(cacheKey);
            if (data != null)
            {
                return data;
            }

            var marketSettingsItem = GetMarketSettingsItem();

            var markets = new Dictionary<string, MarketSettings>();

            if (marketSettingsItem == null)
            {
                return markets;
            }

            foreach (var itemLanguage in marketSettingsItem.Languages)
            {
                var settingsItemInLanguage = marketSettingsItem.Database.GetItem(marketSettingsItem.ID, itemLanguage);
                if (settingsItemInLanguage.Versions.Count > 0)
                {
                    var marketItem = GetReferenceTargetItemFromUtils(settingsItemInLanguage);
                    if (marketItem != null)
                    {
                        markets.Add(itemLanguage.Name, new MarketSettings(marketItem));
                    }
                }
            }

            if (markets.Any())
            {
                cache.StoreItem(cacheKey, markets);
            }

            return markets;
        }

        internal virtual Item GetReferenceTargetItemFromUtils(Item settingsItemInLanguage) => FieldUtils.GetReferenceTargetItem(Templates.MarketSettings.Fields.Market, settingsItemInLanguage);

        internal virtual Item GetMarketSettingsItem() => Context.Database.SelectSingleItem($"{Context.Site.RootPath}/*[@@templateid ='{Templates.Settings.Id}']/*[@@templateid ='{Templates.MarketSettings.Id}']");
    }
}
