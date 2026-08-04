using System.Collections.Generic;
using Sitecore.Data;
using Sitecore.Data.Items;

namespace easyJet.Feature.ScrappingTrigger.Services
{
    public interface IScrapingTriggerFilterService
    {
        List<Item> Filter(List<Item> items);

        bool IsMatching(Item item);

        bool HasRedirect(Item item);

        IEnumerable<Item> GetPageItems(Item item, List<ID> deletedItemIds);
    }
}