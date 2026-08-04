using easyJet.Feature.ScrappingTrigger.Settings;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore.Abstractions;
using Sitecore.Data.Items;
using Sitecore.Links;
using Sitecore.Sites;

namespace easyJet.Feature.ScrappingTrigger.Services
{
    [Service(typeof(IScrapingTriggerUrlService), Lifetime = Lifetime.Transient)]
    public class ScrapingTriggerUrlService : IScrapingTriggerUrlService
    {
        private readonly BaseLinkManager linkManager;
        private readonly ScrapingTriggerSettings settings;

        public ScrapingTriggerUrlService(BaseLinkManager linkManager, IScrapingTriggerSettingsService settingsService)
        {
            this.linkManager = linkManager;
            settings = settingsService.GetSettings();
        }

        public string GetItemUrl(Item item)
        {
            if (item == null)
            {
                return string.Empty;
            }

            var siteName = item?.GetSiteContext()?.Name;
            var options = linkManager.GetDefaultUrlBuilderOptions();
            options.Site = SiteContext.GetSite(siteName);
            options.LanguageEmbedding = LanguageEmbedding.Never;
            options.AlwaysIncludeServerUrl = false;

            var url = linkManager.GetItemUrl(item, options)?.Replace("/destinations", string.Empty) ?? string.Empty;
            return $"{settings.BaseUrl}{url}";
        }
    }
}
