using System;
using System.Linq;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using Sitecore;
using Sitecore.Configuration;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;
using Sitecore.LayoutService.Mvc.ItemResolving;
using Sitecore.LayoutService.Mvc.Routing;

namespace easyJet.Foundation.Destinations.Pipelines.RequestBegin
{
    public class DynamicPromoPageContextItemResolver : BaseContextItemResolver
    {
        protected override string JssApiPrefix => Settings.GetSetting("Destinations.DynamicPromoPages.JssApiPrefix");

        protected override string CachePrefix => "DynamicPromoPageItem";

        /// <summary>
        /// Initializes a new instance of the <see cref="DynamicPromoPageContextItemResolver"/> class.
        /// </summary>
        /// <param name="itemResolver">itemResolver.</param>
        /// <param name="routeMapper">routeMapper.</param>
        /// <param name="cache">cache.</param>
        public DynamicPromoPageContextItemResolver(IItemResolver itemResolver, IRouteMapper routeMapper, IHtmlCacheRepository cache)
            : base(itemResolver, routeMapper, cache)
        {
        }

        /// <inheritdoc/>
        protected override Item ResolveItem(string path)
        {
            var dynamicPromoPageUrlSegment = path.Split(new[] { '/' }, StringSplitOptions.RemoveEmptyEntries).FirstOrDefault();

            var item = Context.Database?
                .SelectItems($"{Context.Site?.StartPath}/*[@@templatename='Dynamic Promo Pages Folder']//*[@@templatename='Dynamic Promo Page']")
                .FirstOrDefault(x => string.Join("-", GetHotelThemeTypeName(x), GetHotelThemeName(x)).Trim('-').Equals(dynamicPromoPageUrlSegment, StringComparison.InvariantCultureIgnoreCase));

            return item;
        }

        /// <summary>
        /// Get Type name from Name field.
        /// </summary>
        /// <param name="item">Dynamic Promo Page Item.</param>
        /// <returns>Type name.</returns>
        private string GetHotelThemeTypeName(Item item)
        {
            var type = ((MultilistField)item.Fields[Constants.Fields.DynamicPromo.HotelThemeType])?.GetItems()?.FirstOrDefault();

            return GetName(type);
        }

        /// <summary>
        /// Get Theme name from Name field.
        /// </summary>
        /// <param name="item">Dynamic Promo Page Item.</param>
        /// <returns>Theme name.</returns>
        private string GetHotelThemeName(Item item)
        {
            var theme = ((LookupField)item.Fields[Constants.Fields.DynamicPromo.HotelTheme])?.TargetItem;

            return GetName(theme);
        }

        /// <summary>
        /// Get Value from Name field.
        /// </summary>
        /// <param name="item">Item.</param>
        /// <returns>Value of Name field.</returns>
        private string GetName(Item item)
        {
            return !string.IsNullOrWhiteSpace(item?[Constants.Fields.DestinationGuideTheme.DestinationGuideUrl]) ? item[Constants.Fields.DestinationGuideTheme.DestinationGuideUrl].Replace(' ', '-').ToLower() : string.Empty;
        }
    }
}