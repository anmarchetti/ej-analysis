using Sitecore.Data.Items;

namespace easyJet.Feature.ScrappingTrigger.Services
{
    public interface IScrapingTriggerUrlService
    {
        string GetItemUrl(Item item);
    }
}
