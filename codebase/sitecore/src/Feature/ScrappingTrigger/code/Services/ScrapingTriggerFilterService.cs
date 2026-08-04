using System.Collections.Generic;
using System.Linq;
using easyJet.Feature.ScrappingTrigger.Settings;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using Sitecore.Data;
using Sitecore.Data.Items;

namespace easyJet.Feature.ScrappingTrigger.Services
{
    [Service(typeof(IScrapingTriggerFilterService), Lifetime = Lifetime.Transient)]
    public class ScrapingTriggerFilterService : IScrapingTriggerFilterService
    {
        private readonly ScrapingTriggerSettings settings;

        public ScrapingTriggerFilterService(IScrapingTriggerSettingsService settingsService)
        {
            settings = settingsService.GetSettings();
        }

        public List<Item> Filter(List<Item> items)
        {
            if (items == null || !items.Any())
            {
                return null;
            }

            return items.Where(i => settings.Templates.Contains(i.TemplateID)).ToList();
        }

        public bool IsMatching(Item item)
        {
            return item != null && settings.Templates.Contains(item.TemplateID);
        }

        public bool HasRedirect(Item item)
        {
            return !string.IsNullOrEmpty(item?.Fields[Constants.Fields.RedirectUrl]?.Value);
        }

        public IEnumerable<Item> GetPageItems(Item item, List<ID> deletedItemIds)
        {
            if (item == null || deletedItemIds == null)
            {
                yield break;
            }

            if (IsMatching(item) && !deletedItemIds.Contains(item.ID))
            {
                yield return item;
            }
            else
            {
                foreach (var template in settings.Templates)
                {
                    var query = $"./ancestor::*[@@templateid='{template}']";
                    var ancestor = item.Axes.SelectSingleItem(query);
                    if (ancestor != null && !deletedItemIds.Contains(ancestor.ID))
                    {
                        yield return ancestor;
                    }
                }
            }
        }
    }
}