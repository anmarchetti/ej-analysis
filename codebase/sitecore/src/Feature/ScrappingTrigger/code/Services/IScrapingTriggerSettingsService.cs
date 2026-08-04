using easyJet.Feature.ScrappingTrigger.Settings;

namespace easyJet.Feature.ScrappingTrigger.Services
{
    public interface IScrapingTriggerSettingsService
    {
        ScrapingTriggerSettings GetSettings();
    }
}