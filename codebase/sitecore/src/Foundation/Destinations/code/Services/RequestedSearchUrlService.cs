using System.Collections.Generic;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using Sitecore.Abstractions;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Services
{
    [Service(typeof(IRequestedSearchUrlService), Lifetime = Lifetime.Singleton)]
    public class RequestedSearchUrlService : BaseUrlBuilderService, IRequestedSearchUrlService
    {
        public RequestedSearchUrlService(BaseLinkManager linkManager)
            : base(linkManager)
        {
        }

        public string GetLiveSiteBaseUrl(Item contextItem, string liveSiteUrl)
        {
            var liveSiteBaseUrlFromMarketFolder = GetFieldValueFromAncestor(contextItem, Constants.TemplateIds.RequestedSearchesMarketFolder, "LiveSiteBaseUrl");

            if (!string.IsNullOrEmpty(liveSiteBaseUrlFromMarketFolder))
            {
                return liveSiteBaseUrlFromMarketFolder;
            }

            liveSiteUrl = FormatLiveSiteUrlWithLanguage(contextItem, liveSiteUrl);
            return liveSiteUrl;
        }

        public new string BuildUrl(Item item, string baseUrl)
        {
            return base.BuildUrl(item, baseUrl);
        }

        private static string FormatLiveSiteUrlWithLanguage(Item contextItem, string liveSiteUrl)
        {
            var formattedLiveSiteUrl = liveSiteUrl.Replace("{language}", contextItem.Language.Name);
            return formattedLiveSiteUrl.TrimEnd('/');
        }
    }
}
