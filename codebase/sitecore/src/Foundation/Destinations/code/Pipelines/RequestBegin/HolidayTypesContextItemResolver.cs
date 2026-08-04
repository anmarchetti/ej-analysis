using System;
using System.Globalization;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using Sitecore;
using Sitecore.Configuration;
using Sitecore.Data.Items;
using Sitecore.Globalization;
using Sitecore.IO;
using Sitecore.LayoutService.Mvc.ItemResolving;
using Sitecore.LayoutService.Mvc.Routing;

namespace easyJet.Foundation.Destinations.Pipelines.RequestBegin
{
    public class HolidayTypesContextItemResolver : BaseContextItemResolver
    {
        protected override string CachePrefix => "HolidayTypeItem";

        protected override string JssApiPrefix => Settings.GetSetting("Destinations.HolidayTypes.JssApiPrefix");

        /// <summary>
        /// Initializes a new instance of the <see cref="HolidayTypesContextItemResolver"/> class.
        /// </summary>
        /// <param name="itemResolver">itemResolver.</param>
        /// <param name="routeMapper">routeMapper.</param>
        /// <param name="cache">cache.</param>
        public HolidayTypesContextItemResolver(IItemResolver itemResolver, IRouteMapper routeMapper, IHtmlCacheRepository cache)
            : base(itemResolver, routeMapper, cache)
        {
        }

        // ToDo move to LanguageUtils class
        public static string GetCountryCode(Language language)
        {
            return GetCountryCode(language.Name);
        }

        public static string GetCountryCode(string language)
        {
            var dash = language.IndexOf("Cyrl", StringComparison.InvariantCultureIgnoreCase) > 0 ||
                       language.IndexOf("Latn", StringComparison.InvariantCultureIgnoreCase) > 0
                ? language.LastIndexOf('-')
                : language.IndexOf('-');

            return dash > 0 && dash < language.Length - 1 ? language.Substring(dash + 1) : null;
        }

        /// <inheritdoc/>
        protected override Item ResolveItem(string path)
        {
            var language = Context.Language;
            var countryCode = GetCountryCode(language);

            string itemPath;
            if (string.IsNullOrEmpty(countryCode) || language.Name == "en")
            {
                itemPath = FileUtil.MakePath(JssApiPrefix, path, '/');
            }
            else
            {
                itemPath = FileUtil.MakePath(JssApiPrefix + " " + countryCode.ToUpper(CultureInfo.InvariantCulture), path, '/');
            }

            var item = ItemResolver.Resolve(itemPath, SearchRoots.SiteStartItem, out var accessDenied);
            return item;
        }
    }
}