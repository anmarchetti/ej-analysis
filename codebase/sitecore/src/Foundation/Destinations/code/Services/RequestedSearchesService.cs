using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Destinations.Helpers;
using easyJet.Foundation.Destinations.Mappers;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Multisite;
using easyJet.Foundation.Multisite.Extensions;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using easyJet.Foundation.SitecoreExtensions.Utils;
using Sitecore;
using Sitecore.Abstractions;
using Sitecore.Configuration;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Services
{
    [Service(typeof(IRequestedSearchesService), Lifetime = Lifetime.Singleton)]
    public class RequestedSearchesService : IRequestedSearchesService
    {
        private readonly IHtmlCacheRepository cache;
        private readonly IRequestedSearchUrlService requestedSearchUrlService;
        private readonly string liveSiteUrl;

        /// <summary>
        /// Initializes a new instance of the <see cref="RequestedSearchesService"/> class.
        /// </summary>
        /// <param name="cache">HTML cache.</param>
        public RequestedSearchesService(IHtmlCacheRepository cache, IRequestedSearchUrlService requestedSearchUrlService, BaseSettings baseSettings)
        {
            this.cache = cache;
            this.requestedSearchUrlService = requestedSearchUrlService;
            liveSiteUrl = baseSettings.GetSetting("Destinations.LiveSiteUrl");
        }

        /// <inheritdoc />
        public IEnumerable<RequestedSearch> GetRequestedSearches(string marketCode)
        {
            return cache.GetOrAdd($"Destinations.Cache.{Constants.TemplateIds.RequestedSearchesFolder}.{marketCode}", () =>
            {
                var requestedSearchesFolder = Context.Database.SelectSingleItem($"{Context.Site.RootPath}/Data/*[@@templateId='{Constants.TemplateIds.RequestedSearchesFolder}']");
                if (requestedSearchesFolder == null)
                {
                    return Enumerable.Empty<RequestedSearch>();
                }

                var requestedSearchesMarketFolder = requestedSearchesFolder.Children
                    .Where(item => item.TemplateID == Constants.TemplateIds.RequestedSearchesMarketFolder)
                    .FirstOrDefault(item =>
                    {
                        var marketItem = FieldUtils.GetReferenceTargetItem(Templates.MarketSettings.Fields.Market, item);
                        if (marketItem == null)
                        {
                            return false;
                        }

                        return marketItem?.Fields[Templates.Market.Fields.Code]?.Value == marketCode;
                    });

                if (requestedSearchesMarketFolder == null)
                {
                    return Enumerable.Empty<RequestedSearch>();
                }

                return requestedSearchesMarketFolder.Children
                    .Where(x => x.TemplateID == Constants.TemplateIds.RequestedSearch
                                && MainUtil.GetBool(x[Constants.Fields.RequestedSearch.Enabled], false))
                    .Select(GetRequestedSearchItem).Where(x => x != null).ToList();
            });
        }

        /// <inheritdoc/>
        public RequestedSearch GetRequestedSearchItem(Item item)
        {
            var promoPage = item.GetItems(Constants.Fields.RequestedSearch.PromoPage).FirstOrDefault();
            if (promoPage == null)
            {
                return null;
            }

            var database = Context.Database ?? item.Database;

            var kidsGoFree = database
                .SelectItems($"{item.GetSettingsFolderQuery()}/*[@@templateId='{Constants.TemplateIds.OffersAndPromotionsSettings}']")
                .SelectMany(x => x[Constants.Fields.OffersAndPromotionsSettings.KidsGoFree].Split('|'));

            var requestedSearch = RequestedSearchesMapper.MapFromRequestedSearchItem(promoPage, item, kidsGoFree.Contains(promoPage.ID.ToString()));

            var requestedSearchBaseUrl = requestedSearchUrlService.GetLiveSiteBaseUrl(item, liveSiteUrl);
            var requestedSearchUrl = requestedSearchUrlService.BuildUrl(promoPage, requestedSearchBaseUrl);
            requestedSearch.Url = requestedSearchUrl;

            return requestedSearch;
        }
    }
}