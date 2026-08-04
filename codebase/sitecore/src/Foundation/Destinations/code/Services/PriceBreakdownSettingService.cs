using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Multisite;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using Sitecore;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Services
{
    [Service(typeof(IPriceBreakdownSettingService), Lifetime = Lifetime.Singleton)]
    public class PriceBreakdownSettingService : IPriceBreakdownSettingService
    {
        private readonly IHtmlCacheRepository cache;

        public PriceBreakdownSettingService(IHtmlCacheRepository cache)
        {
            this.cache = cache;
        }

        public Dictionary<string, PriceBreakdownSetting> GetPriceBreakdownSettings()
        {
            string cacheKey = $"Destinations.Cache.PriceBreakdownSettings-{Sitecore.Context.Language.Name}";
            var data = cache.GetItem<Dictionary<string, PriceBreakdownSetting>>(cacheKey);
            if (data != null)
            {
                return data;
            }

            var priceSettingFolder = Context.Database
                .SelectSingleItem($"{Context.Site.RootPath}/*[@@templateid ='{Templates.Settings.Id}']/*[@@templateid ='{Constants.TemplateIds.PriceBreakdownSettingsFolder}']");

            if (priceSettingFolder == null)
            {
                return new Dictionary<string, PriceBreakdownSetting>();
            }

            var priceSettings = new Dictionary<string, PriceBreakdownSetting>();
            var itemSettings = priceSettingFolder.Children.Where(x => x.TemplateID == Constants.TemplateIds.PriceBreakdownSetting);

            foreach (Item item in itemSettings)
            {
                var keys = item.Fields[Constants.Fields.PriceBreakdownSetting.AtcomCodes].Value
                    .Split(',')
                    .Select(x => x.Trim());

                foreach (var key in keys)
                {
                    if (!priceSettings.ContainsKey(key))
                    {
                        priceSettings.Add(key, new PriceBreakdownSetting(item));
                    }
                    else
                    {
                        priceSettings[key].AddScopesFromItem(item);
                    }
                }
            }

            if (priceSettings.Any())
            {
                cache.StoreItem(cacheKey, priceSettings);
            }

            return priceSettings;
        }
    }
}