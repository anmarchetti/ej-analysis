using System;
using System.Linq;
using easyJet.Foundation.Destinations.Models.Domain.DynamicPromoPage;
using easyJet.Foundation.Multisite;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore;
using Sitecore.Configuration;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;
using Sitecore.LayoutService.Mvc.ItemResolving;
using Sitecore.LayoutService.Mvc.Routing;
using Sitecore.Mvc.Pipelines.Request.RequestBegin;

namespace easyJet.Foundation.Destinations.Pipelines.RequestBegin
{
    public class DynamicPromoPageContextItemResolverExtended : BaseContextItemResolver
    {
        protected override string JssApiPrefix => Settings.GetSetting("Destinations.DynamicPromoPages.JssApiPrefix");

        protected override string CachePrefix => "DynamicPromoPageItemEx";

        private const string PromoPageFolder = "/sitecore/content/EasyJet/Holidays/Home/DynamicPromoPages";
        private const string DynamicPromoPageTemplate = "Dynamic Promo Page Layout";

        private readonly ISitecoreContext sitecoreContext;

        public DynamicPromoPageContextItemResolverExtended(
            ISitecoreContext sitecoreContext,
            IItemResolver itemResolver,
            IRouteMapper routeMapper,
            IHtmlCacheRepository cache)
            : base(itemResolver, routeMapper, cache)
        {
            this.sitecoreContext = sitecoreContext;
        }

        public override void Process(RequestBeginArgs args)
        {
            if (sitecoreContext.Site.IsBackend)
            {
                return;
            }

            base.Process(args);
        }

        protected override Item GetContextItem(string path) => ResolveItem(path);

        protected override Item ResolveItem(string path)
        {
            var dynamicPromoPageUrlSegments = path.Split(new[] { '/' }, StringSplitOptions.RemoveEmptyEntries);
            var promoPage = GetPromoPage(dynamicPromoPageUrlSegments[dynamicPromoPageUrlSegments.Length - 1]);
            var contextItem = promoPage?.Item;

            return contextItem;
        }

        private PromoPage GetPromoPage(string promoPageName)
            => GetDynamicPromoPages().FirstOrDefault(promoPage => promoPage.UrlPathName.Equals(promoPageName, StringComparison.OrdinalIgnoreCase));

        private PromoPage[] GetDynamicPromoPages()
        {
            var cacheKey = $"{CachePrefix}-promoPages-{sitecoreContext.Language.Name}";
            var promoPages = Cache.GetItem<PromoPage[]>(cacheKey);

            if (promoPages != null && promoPages.Length > 0)
            {
                return promoPages;
            }

            var dynamicPromoPageItems = sitecoreContext.Database.SelectItems($"{PromoPageFolder}/*[@@templatename='{DynamicPromoPageTemplate}']");

            if (dynamicPromoPageItems == null || dynamicPromoPageItems.Length == 0)
            {
                return Array.Empty<PromoPage>();
            }

            promoPages = dynamicPromoPageItems.Select(promoPage
                => new PromoPage { Item = promoPage, UrlPathName = promoPage[Constants.Fields.DynamicPromoPage.UrlPathName].Replace(" ", "-") }).ToArray();

            Cache.StoreItem(cacheKey, promoPages, 60);
            return promoPages;
        }
    }
}